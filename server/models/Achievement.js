const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  xpReward: { type: Number, default: 50 },
  category: { type: String, default: 'general' },
  condition: { type: String, default: '' },
});

module.exports = mongoose.model('Achievement', achievementSchema);
