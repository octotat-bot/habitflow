const express = require('express');
const router = express.Router();
const { format, differenceInDays } = require('date-fns');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');
const DailySnapshot = require('../models/DailySnapshot');

// PUT /api/profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, avatarBase64, weekStartDay, autoFreeze } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (avatarBase64 !== undefined) user.avatarBase64 = avatarBase64;
    if (weekStartDay !== undefined) user.weekStartDay = weekStartDay;
    if (autoFreeze !== undefined) user.autoFreeze = autoFreeze;

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.json({ user: userObj });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/profile/export
router.get('/export', auth, async (req, res) => {
  try {
    const [user, habits, completions, snapshots] = await Promise.all([
      User.findById(req.userId).select('-passwordHash'),
      Habit.find({ userId: req.userId }),
      HabitCompletion.find({ userId: req.userId }).sort({ date: -1 }),
      DailySnapshot.find({ userId: req.userId }).sort({ date: -1 }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user.toObject(),
      habits,
      completions,
      snapshots,
    };

    res.setHeader('Content-Disposition', 'attachment; filename="habitflow-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// DELETE /api/profile — delete account
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    await Promise.all([
      User.findByIdAndDelete(userId),
      Habit.deleteMany({ userId }),
      HabitCompletion.deleteMany({ userId }),
      DailySnapshot.deleteMany({ userId }),
    ]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
