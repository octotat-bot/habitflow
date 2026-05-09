const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { format } = require('date-fns');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const HabitCompletion = require('../models/HabitCompletion');
const Habit = require('../models/Habit');
const { calculateXPForCompletion, awardXP } = require('../utils/xpEngine');
const { calculateStreakAfterCompletion, calculateDailyStreak } = require('../utils/streakEngine');
const { checkAndAwardAchievements } = require('../utils/achievementChecker');
const { updateDailySnapshot } = require('../utils/snapshotUpdater');

// POST /api/completions
router.post('/',
  auth,
  [
    body('habitId').notEmpty().withMessage('habitId required'),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  ],
  validate,
  async (req, res) => {
    try {
      const { habitId, date, note, mood, energy } = req.body;

      const habit = await Habit.findOne({ _id: habitId, userId: req.userId });
      if (!habit) return res.status(404).json({ error: 'Habit not found' });

      // Check for existing completion
      const existing = await HabitCompletion.findOne({ habitId, date });
      if (existing) {
        return res.status(409).json({ error: 'Already completed for this date' });
      }

      const completion = await HabitCompletion.create({
        habitId,
        userId: req.userId,
        date,
        completedAt: new Date(),
        note: note || '',
        mood: mood || null,
        energy: energy || null,
      });

      // Update streak
      const allCompletions = await HabitCompletion.find({ habitId, userId: req.userId });
      const allDates = allCompletions.map(c => c.date);
      const { streak, milestone } = calculateStreakAfterCompletion(allDates, date);

      habit.currentStreak = streak;
      if (streak > habit.bestStreak) habit.bestStreak = streak;
      habit.totalCompletions += 1;

      // Calculate XP
      const xpAmount = calculateXPForCompletion(habit, note);
      habit.xpEarned += xpAmount;
      await habit.save();

      // Award XP to user
      const xpResult = await awardXP(req.userId, xpAmount);

      // Check achievements
      const { newAchievements } = await checkAndAwardAchievements(req.userId, {
        completedAt: completion.completedAt,
        habitId,
      });

      // Update snapshot
      await updateDailySnapshot(req.userId, date);

      // Check if all habits done today
      const todayDate = format(new Date(), 'yyyy-MM-dd');
      const todayCompletions = await HabitCompletion.find({ userId: req.userId, date: todayDate });
      const activeHabits = await Habit.find({ userId: req.userId, isArchived: false });
      const allDone = todayCompletions.length >= activeHabits.length && activeHabits.length > 0;

      // If all done, award bonus XP
      let bonusXPResult = null;
      if (allDone && date === todayDate) {
        bonusXPResult = await awardXP(req.userId, 50);
      }

      res.status(201).json({
        completion,
        streak,
        milestone,
        xp: xpResult,
        bonusXP: bonusXPResult,
        newAchievements,
        allDoneToday: allDone,
        leveledUp: xpResult?.leveledUp || bonusXPResult?.leveledUp || false,
        newLevel: xpResult?.newLevel || bonusXPResult?.newLevel || null,
      });
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Already completed for this date' });
      }
      res.status(500).json({ error: 'Failed to mark completion' });
    }
  }
);

// DELETE /api/completions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const completion = await HabitCompletion.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!completion) return res.status(404).json({ error: 'Completion not found' });

    const { habitId, date } = completion;
    await completion.deleteOne();

    // Recalculate streak
    const allCompletions = await HabitCompletion.find({ habitId, userId: req.userId });
    const allDates = allCompletions.map(c => c.date);
    const newStreak = calculateDailyStreak(allDates);

    await Habit.findByIdAndUpdate(habitId, {
      currentStreak: newStreak,
      $inc: { totalCompletions: -1 },
    });

    await updateDailySnapshot(req.userId, date);

    res.json({ message: 'Completion undone', newStreak });
  } catch (err) {
    res.status(500).json({ error: 'Failed to undo completion' });
  }
});

// GET /api/completions/today
router.get('/today', auth, async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const completions = await HabitCompletion.find({ userId: req.userId, date: today });
    res.json({ completions, date: today });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today completions' });
  }
});

// GET /api/completions/range?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/range', auth, async (req, res) => {
  try {
    const { start, end, habitId } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates required' });
    }

    const filter = {
      userId: req.userId,
      date: { $gte: start, $lte: end },
    };
    if (habitId) filter.habitId = habitId;

    const completions = await HabitCompletion.find(filter).sort({ date: -1, completedAt: -1 });
    res.json({ completions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

module.exports = router;
