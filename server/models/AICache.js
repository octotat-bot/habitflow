const mongoose = require('mongoose');

// Store cached AI responses per feature per user
const aiCacheSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feature:   { type: String, required: true }, // 'reschedule' | 'suggestions' | 'cascade' | 'autopsy_habitId'
  data:      { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
});

aiCacheSchema.index({ userId: 1, feature: 1 });

module.exports = mongoose.model('AICache', aiCacheSchema);
