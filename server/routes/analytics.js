const express = require('express');
const router = express.Router();
const { format, subDays, eachDayOfInterval, parseISO, getDay, startOfWeek, endOfWeek } = require('date-fns');
const auth = require('../middleware/auth');
const HabitCompletion = require('../models/HabitCompletion');
const Habit = require('../models/Habit');
const DailySnapshot = require('../models/DailySnapshot');
const User = require('../models/User');

// GET /api/analytics/overview
router.get('/overview', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    const today = format(new Date(), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const [habits, snapshots] = await Promise.all([
      Habit.find({ userId: req.userId, isArchived: false }),
      DailySnapshot.find({
        userId: req.userId,
        date: { $gte: thirtyDaysAgo, $lte: today },
      }),
    ]);

    const validSnapshots = snapshots.filter(s => s.totalHabits > 0);
    const completionRate30d = validSnapshots.length > 0
      ? Math.round(validSnapshots.reduce((sum, s) => sum + s.completionRate, 0) / validSnapshots.length)
      : 0;

    const activeStreaks = habits.filter(h => h.currentStreak > 0).length;
    const totalXP = user.xp;
    const weeklyScore = user.weeklyScore;
    const totalCompletions = user.totalHabitsCompleted || habits.reduce((s, h) => s + h.totalCompletions, 0);

    res.json({
      completionRate30d,
      activeStreaks,
      totalXP,
      weeklyScore,
      lastWeekScore: user.lastWeekScore || 0,
      totalCompletions,
      level: user.level,
      streakFreezes: user.streakFreezes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /api/analytics/heatmap  — 84 days
router.get('/heatmap', auth, async (req, res) => {
  try {
    const today = new Date();
    const start = subDays(today, 83);
    const habits = await Habit.find({ userId: req.userId, isArchived: false });
    const totalHabits = habits.length;

    const startStr = format(start, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');

    const completions = await HabitCompletion.aggregate([
      {
        $match: {
          userId: req.userId,
          date: { $gte: startStr, $lte: todayStr },
        },
      },
      { $group: { _id: '$date', count: { $sum: 1 } } },
    ]);

    const completionMap = {};
    for (const c of completions) completionMap[c._id] = c.count;

    const days = eachDayOfInterval({ start, end: today });
    const heatmap = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = completionMap[dateStr] || 0;
      const rate = totalHabits > 0 ? Math.round((count / totalHabits) * 100) : 0;
      return { date: dateStr, count, rate };
    });

    res.json({ heatmap });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

// GET /api/analytics/trends  — 30 days
router.get('/trends', auth, async (req, res) => {
  try {
    const today = new Date();
    const start = subDays(today, 29);
    const startStr = format(start, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');

    const snapshots = await DailySnapshot.find({
      userId: req.userId,
      date: { $gte: startStr, $lte: todayStr },
    });

    const snapshotMap = {};
    for (const s of snapshots) snapshotMap[s.date] = s;

    const days = eachDayOfInterval({ start, end: today });
    const trends = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const snap = snapshotMap[dateStr];
      return {
        date: dateStr,
        rate: snap ? snap.completionRate : null,
        mood: snap ? snap.moodAvg : null,
        energy: snap ? snap.energyAvg : null,
        xp: snap ? snap.xpEarned : 0,
      };
    });

    res.json({ trends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/analytics/weekly — day-of-week average
router.get('/weekly', auth, async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

    const snapshots = await DailySnapshot.find({
      userId: req.userId,
      date: { $gte: ninetyDaysAgo, $lte: today },
      totalHabits: { $gt: 0 },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (const snap of snapshots) {
      const day = getDay(parseISO(snap.date));
      dayData[day].push(snap.completionRate);
    }

    const weekly = {};
    for (let i = 0; i < 7; i++) {
      const rates = dayData[i];
      weekly[dayNames[i]] = rates.length > 0
        ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
        : 0;
    }

    res.json({ weekly });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// GET /api/analytics/habit/:id
router.get('/habit/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const completions = await HabitCompletion.find({
      habitId: req.params.id,
      userId: req.userId,
    }).sort({ date: -1 });

    // 84-day heatmap for this habit
    const today = new Date();
    const start = subDays(today, 83);
    const dateSet = new Set(completions.map(c => c.date));
    const heatmapDays = eachDayOfInterval({ start, end: today }).map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      completed: dateSet.has(format(d, 'yyyy-MM-dd')),
    }));

    // Monthly stats (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d = subDays(today, i * 30);
      const monthStr = format(d, 'MMM yyyy');
      const monthStart = format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
      const monthEnd = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
      const monthCompletions = completions.filter(c => c.date >= monthStart && c.date <= monthEnd);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      monthlyStats.push({
        month: monthStr,
        count: monthCompletions.length,
        rate: Math.round((monthCompletions.length / daysInMonth) * 100),
      });
    }

    // Mood/energy trends
    const moodData = completions.filter(c => c.mood != null).slice(0, 30).map(c => ({
      date: c.date,
      mood: c.mood,
      energy: c.energy,
    }));

    res.json({
      habit,
      heatmap: heatmapDays,
      monthlyStats,
      moodData,
      totalCompletions: completions.length,
      recentCompletions: completions.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habit analytics' });
  }
});

module.exports = router;
