const mongoose = require('mongoose');

const dailySnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  totalHabits: { type: Number, default: 0 },
  completedHabits: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 }, // 0-100
  moodAvg: { type: Number, default: null },
  energyAvg: { type: Number, default: null },
  xpEarned: { type: Number, default: 0 },
});

dailySnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySnapshot', dailySnapshotSchema);
