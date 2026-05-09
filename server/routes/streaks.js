const express = require('express');
const router = express.Router();
const { format, subDays } = require('date-fns');
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');
const User = require('../models/User');

// POST /api/streaks/freeze
router.post('/freeze', auth, async (req, res) => {
  try {
    const { habitId } = req.body;
    if (!habitId) return res.status(400).json({ error: 'habitId required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.streakFreezes <= 0) {
      return res.status(400).json({ error: 'No streak freezes available' });
    }

    const habit = await Habit.findOne({ _id: habitId, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const hasYesterday = await HabitCompletion.findOne({ habitId, date: yesterday });

    if (!hasYesterday && habit.currentStreak > 0) {
      // Apply freeze — create a completion for yesterday
      try {
        await HabitCompletion.create({
          habitId,
          userId: req.userId,
          date: yesterday,
          completedAt: new Date(),
          note: '❄️ Streak freeze applied',
        });
      } catch (e) {
        // Already exists
      }

      user.streakFreezes -= 1;
      user.freezeHistory.push({ habitId, date: yesterday, action: 'spent' });
      await user.save();

      // Recalculate streak
      const allCompletions = await HabitCompletion.find({ habitId, userId: req.userId });
      const allDates = allCompletions.map(c => c.date);
      const { calculateDailyStreak } = require('../utils/streakEngine');
      const newStreak = calculateDailyStreak(allDates);
      await Habit.findByIdAndUpdate(habitId, { currentStreak: newStreak });

      return res.json({
        message: 'Streak freeze applied',
        freezesRemaining: user.streakFreezes,
        newStreak,
      });
    }

    return res.status(400).json({ error: 'Freeze not needed or streak already active' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply freeze' });
  }
});

module.exports = router;
