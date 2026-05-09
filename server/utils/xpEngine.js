const User = require('../models/User');

const XP = {
  COMPLETE_HABIT: 10,
  STREAK_OVER_7: 15,
  STREAK_OVER_30: 25,
  ALL_HABITS_BONUS: 50,
  PERFECT_WEEK: 200,
  NOTE_ADDED: 5,
};

// Exponential level thresholds
function getLevelThreshold(level) {
  if (level <= 1) return 0;
  return Math.floor(200 * Math.pow(1.3, level - 2));
}

function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getLevelThreshold(i);
  }
  return total;
}

function calculateLevel(totalXp) {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const threshold = getLevelThreshold(level + 1);
    if (accumulated + threshold > totalXp) break;
    accumulated += threshold;
    level++;
    if (level >= 100) break;
  }
  return level;
}

async function awardXP(userId, amount, weeklyAmount = null) {
  const user = await User.findById(userId);
  if (!user) return null;

  const oldLevel = user.level;
  user.xp += amount;
  user.weeklyScore += weeklyAmount !== null ? weeklyAmount : amount;

  const newLevel = calculateLevel(user.xp);
  user.level = newLevel;

  await user.save();

  const leveledUp = newLevel > oldLevel;
  return {
    xpAdded: amount,
    totalXp: user.xp,
    level: newLevel,
    leveledUp,
    newLevel: leveledUp ? newLevel : null,
  };
}

function calculateXPForCompletion(habit, note = '') {
  let xp = XP.COMPLETE_HABIT;

  if (habit.currentStreak >= 30) {
    xp += XP.STREAK_OVER_30;
  } else if (habit.currentStreak >= 7) {
    xp += XP.STREAK_OVER_7;
  }

  if (note && note.trim().length > 0) {
    xp += XP.NOTE_ADDED;
  }

  return xp;
}

async function resetWeeklyScoreIfNeeded(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const resetDay = 1; // Monday

  if (!user.weeklyScoreResetAt) {
    user.weeklyScoreResetAt = now;
    await user.save();
    return;
  }

  const lastReset = new Date(user.weeklyScoreResetAt);
  const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

  if (daysSinceReset >= 7 && dayOfWeek === resetDay) {
    user.lastWeekScore = user.weeklyScore;
    user.weeklyScore = 0;
    user.weeklyScoreResetAt = now;
    // Award streak freeze for perfect week (handled in achievement checker)
    await user.save();
  }
}

module.exports = {
  calculateXPForCompletion,
  awardXP,
  calculateLevel,
  resetWeeklyScoreIfNeeded,
  XP,
  getTotalXpForLevel,
  getLevelThreshold,
};
