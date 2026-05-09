const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');

// GET /api/habits
router.get('/', auth, async (req, res) => {
  try {
    const { archived } = req.query;
    const filter = {
      userId: req.userId,
      isArchived: archived === 'true' ? true : false,
    };
    const habits = await Habit.find(filter).sort({ isPinned: -1, sortOrder: 1, createdAt: 1 });
    res.json({ habits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/habits
router.post('/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Habit name is required'),
    body('category').isIn(['Mind', 'Body', 'Work', 'Social', 'Creative', 'Finance', 'Spirit', 'Custom'])
      .withMessage('Invalid category'),
    body('frequency').isIn(['daily', 'weekdays', 'weekends', 'custom', 'x_per_week'])
      .withMessage('Invalid frequency'),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        name, description, icon, color, category, frequency,
        targetDaysOfWeek, timesPerWeek, timeOfDay, stackedAfterId, isPinned,
        habitType, targetDuration, targetQuantity, reminderTime,
      } = req.body;

      const count = await Habit.countDocuments({ userId: req.userId, isArchived: false });

      const habit = await Habit.create({
        userId: req.userId,
        name, description, icon, color, category, frequency,
        targetDaysOfWeek, timesPerWeek, timeOfDay,
        stackedAfterId: stackedAfterId || null,
        isPinned: Boolean(isPinned),
        sortOrder: count,
        // New fields
        habitType:      habitType      || 'boolean',
        targetDuration: targetDuration || null,
        targetQuantity: targetQuantity || null,
        reminderTime:   reminderTime   || null,
      });

      res.status(201).json({ habit });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create habit' });
    }
  }
);

// PUT /api/habits/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const allowed = [
      'name', 'description', 'icon', 'color', 'category', 'frequency',
      'targetDaysOfWeek', 'timesPerWeek', 'timeOfDay', 'stackedAfterId', 'isPinned',
      // New fields
      'habitType', 'targetDuration', 'targetQuantity', 'reminderTime',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) habit[key] = req.body[key];
    }

    await habit.save();
    res.json({ habit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    // Also remove all completions
    await HabitCompletion.deleteMany({ habitId: req.params.id });

    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// PATCH /api/habits/:id/archive
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    habit.isArchived = !habit.isArchived;
    await habit.save();
    res.json({ habit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive habit' });
  }
});

// PATCH /api/habits/:id/pin
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    habit.isPinned = !habit.isPinned;
    await habit.save();
    res.json({ habit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pin habit' });
  }
});

// PATCH /api/habits/reorder
router.patch('/reorder', auth, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId: req.userId },
        update: { $set: { sortOrder: index } },
      },
    }));

    await Habit.bulkWrite(bulkOps);
    res.json({ message: 'Habits reordered' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder habits' });
  }
});

module.exports = router;
