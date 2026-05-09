const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarBase64: { type: String, default: null },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakFreezes: { type: Number, default: 3 },
  totalHabitsCompleted: { type: Number, default: 0 },
  longestStreakEver: { type: Number, default: 0 },
  weeklyScore: { type: Number, default: 0 },
  lastWeekScore: { type: Number, default: 0 },
  weeklyScoreResetAt: { type: Date, default: null },
  theme: { type: String, default: 'obsidian' },
  weekStartDay: { type: Number, default: 1 }, // 0=Sun, 1=Mon
  autoFreeze: { type: Boolean, default: false },
  freezeHistory: [{
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
    date: String,
    action: { type: String, enum: ['spent', 'earned'] },
    createdAt: { type: Date, default: Date.now },
  }],
  ritualDNA: {
    archetype:        { type: String, default: null },
    tagline:          { type: String, default: null },
    insights:         { type: [String], default: [] },
    dominantCategory: { type: String, default: null },
    score:            { type: Number, default: null },
    generatedAt:      { type: Date, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
