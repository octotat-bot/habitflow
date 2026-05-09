const mongoose = require('mongoose');

const journalInsightSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  insight:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

journalInsightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JournalInsight', journalInsightSchema);
