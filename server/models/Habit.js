const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  icon: { type: String, default: '✨' },
  color: { type: String, default: '#C8F135' },
  category: {
    type: String,
    enum: ['Mind', 'Body', 'Work', 'Social', 'Creative', 'Finance', 'Spirit', 'Custom'],
    default: 'Custom',
  },

  // ── Habit type (boolean / duration / quantity) ─────────
  habitType: {
    type: String,
    enum: ['boolean', 'duration', 'quantity'],
    default: 'boolean',
  },
  targetDuration: { type: Number, default: null, min: 1, max: 480 }, // minutes
  targetQuantity: { type: Number, default: null, min: 1, max: 999 },

  // ── Schedule ───────────────────────────────────────────
  frequency: {
    type: String,
    enum: ['daily', 'weekdays', 'weekends', 'custom', 'x_per_week'],
    default: 'daily',
  },
  targetDaysOfWeek: { type: [Number], default: [] },
  timesPerWeek: { type: Number, default: null },
  timeOfDay: {
    type: String,
    enum: ['dawn', 'morning', 'afternoon', 'evening', 'night', null],
    default: null,
  },

  // ── Per-habit reminder (HH:MM, overrides timeOfDay) ───
  reminderTime: {
    type: String,
    default: null,
    validate: {
      validator: (v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
      message: 'reminderTime must be HH:MM format (e.g. "07:30")',
    },
  },

  // ── Habit stacking ─────────────────────────────────────
  stackedAfterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', default: null },

  // ── Stats ──────────────────────────────────────────────
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  totalCompletions: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },

  // ── Flags ──────────────────────────────────────────────
  isArchived: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

habitSchema.index({ userId: 1, isArchived: 1 });
habitSchema.index({ userId: 1, sortOrder: 1 });

module.exports = mongoose.model('Habit', habitSchema);
