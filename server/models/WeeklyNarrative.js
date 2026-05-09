const mongoose = require('mongoose');

const weeklyNarrativeSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  narrative: { type: String, required: true },
  weekStart: { type: String, required: true }, // YYYY-MM-DD
  weekEnd:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

weeklyNarrativeSchema.index({ userId: 1, weekStart: -1 });

module.exports = mongoose.model('WeeklyNarrative', weeklyNarrativeSchema);
