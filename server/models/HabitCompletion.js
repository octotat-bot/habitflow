const mongoose = require('mongoose');

const habitCompletionSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  completedAt: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  mood: { type: Number, min: 1, max: 5, default: null },
  energy: { type: Number, min: 1, max: 5, default: null },
});

habitCompletionSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitCompletionSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('HabitCompletion', habitCompletionSchema);
