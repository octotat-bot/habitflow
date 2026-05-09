require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');

const achievements = [
  {
    key: 'first_step',
    name: 'First Step',
    description: 'Complete your first habit',
    icon: '👣',
    rarity: 'common',
    xpReward: 50,
    category: 'general',
    condition: 'Complete 1 habit total',
  },
  {
    key: 'week_warrior',
    name: 'Week Warrior',
    description: '7-day streak on any habit',
    icon: '⚔️',
    rarity: 'common',
    xpReward: 100,
    category: 'streaks',
    condition: 'Reach a 7-day streak on any habit',
  },
  {
    key: 'stacker',
    name: 'Ritual Architect',
    description: 'Create a habit stack',
    icon: '🔗',
    rarity: 'rare',
    xpReward: 150,
    category: 'habits',
    condition: 'Link one habit to come after another',
  },
  {
    key: 'triple',
    name: 'Triple Threat',
    description: 'Complete 3 habits in one day',
    icon: '🎯',
    rarity: 'common',
    xpReward: 80,
    category: 'general',
    condition: 'Complete 3 or more habits in a single day',
  },
  {
    key: 'month_master',
    name: 'Month Master',
    description: '30-day streak on any habit',
    icon: '📅',
    rarity: 'rare',
    xpReward: 500,
    category: 'streaks',
    condition: 'Reach a 30-day streak on any habit',
  },
  {
    key: 'early_bird',
    name: 'Dawn Ritual',
    description: 'Complete all habits before 8am',
    icon: '🌅',
    rarity: 'rare',
    xpReward: 200,
    category: 'timing',
    condition: 'Complete all your habits before 8:00 AM',
  },
  {
    key: 'night_owl',
    name: 'Midnight Grind',
    description: 'Complete a habit after 11pm',
    icon: '🦉',
    rarity: 'common',
    xpReward: 75,
    category: 'timing',
    condition: 'Mark a habit complete after 11:00 PM',
  },
  {
    key: 'perfect_week',
    name: 'Flawless',
    description: '100% completion for 7 days straight',
    icon: '💎',
    rarity: 'epic',
    xpReward: 400,
    category: 'consistency',
    condition: 'Achieve 100% completion every day for 7 consecutive days',
  },
  {
    key: 'century',
    name: 'The Century',
    description: '100-day streak on any habit',
    icon: '💯',
    rarity: 'legendary',
    xpReward: 1500,
    category: 'streaks',
    condition: 'Reach a 100-day streak on any habit',
  },
  {
    key: 'freeze_saver',
    name: 'Ice Cold',
    description: 'Use a streak freeze',
    icon: '🧊',
    rarity: 'common',
    xpReward: 50,
    category: 'freezes',
    condition: 'Spend a streak freeze to protect a habit',
  },
  {
    key: 'all_categories',
    name: 'Polymath',
    description: 'Active habit in every category',
    icon: '🌐',
    rarity: 'epic',
    xpReward: 300,
    category: 'habits',
    condition: 'Have at least one active habit in all 7 categories',
  },
  {
    key: 'perfect_month',
    name: 'Perfect Month',
    description: '100% completion for 30 days',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 3000,
    category: 'consistency',
    condition: 'Achieve 100% completion every day for 30 consecutive days',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habitflow');
    console.log('✅ Connected to MongoDB');

    for (const ach of achievements) {
      await Achievement.findOneAndUpdate(
        { key: ach.key },
        ach,
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${ach.name}`);
    }

    console.log('\n🎉 All 12 achievements seeded successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
