const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const HabitCompletion = require('../models/HabitCompletion');
const Habit = require('../models/Habit');
const User = require('../models/User');
const { format, getHours } = require('date-fns');

async function checkAndAwardAchievements(userId, triggerData = {}) {
  const [allAchievements, userAchievements, user] = await Promise.all([
    Achievement.find({}),
    UserAchievement.find({ userId }),
    User.findById(userId),
  ]);

  const unlockedKeys = new Set(
    userAchievements.map(ua => {
      const ach = allAchievements.find(a => String(a._id) === String(ua.achievementId));
      return ach ? ach.key : null;
    }).filter(Boolean)
  );

  const habits = await Habit.find({ userId, isArchived: false });
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCompletions = await HabitCompletion.find({ userId, date: today });

  const newAchievements = [];

  for (const achievement of allAchievements) {
    if (unlockedKeys.has(achievement.key)) continue;

    let earned = false;

    switch (achievement.key) {
      case 'first_step': {
        const totalCount = await HabitCompletion.countDocuments({ userId });
        earned = totalCount >= 1;
        break;
      }
      case 'week_warrior': {
        earned = habits.some(h => h.currentStreak >= 7);
        break;
      }
      case 'stacker': {
        earned = habits.some(h => h.stackedAfterId !== null);
        break;
      }
      case 'triple': {
        earned = todayCompletions.length >= 3;
        break;
      }
      case 'month_master': {
        earned = habits.some(h => h.currentStreak >= 30);
        break;
      }
      case 'early_bird': {
        // All habits completed before 8am
        if (todayCompletions.length > 0 && habits.length > 0) {
          const allBeforeEight = todayCompletions.every(c => getHours(new Date(c.completedAt)) < 8);
          earned = allBeforeEight && todayCompletions.length >= habits.length;
        }
        break;
      }
      case 'night_owl': {
        if (triggerData.completedAt) {
          earned = getHours(new Date(triggerData.completedAt)) >= 23;
        }
        break;
      }
      case 'perfect_week': {
        // 100% completion for 7 consecutive days
        const { format: fmt, subDays } = require('date-fns');
        let perfect = true;
        for (let i = 0; i < 7; i++) {
          const dayStr = fmt(subDays(new Date(), i), 'yyyy-MM-dd');
          const dayCompletions = await HabitCompletion.countDocuments({ userId, date: dayStr });
          if (dayCompletions < habits.length || habits.length === 0) { perfect = false; break; }
        }
        earned = perfect;
        break;
      }
      case 'century': {
        earned = habits.some(h => h.currentStreak >= 100);
        break;
      }
      case 'freeze_saver': {
        earned = (user.freezeHistory || []).some(f => f.action === 'spent');
        break;
      }
      case 'all_categories': {
        const categories = ['Mind', 'Body', 'Work', 'Social', 'Creative', 'Finance', 'Spirit'];
        const habitCategories = new Set(habits.map(h => h.category));
        earned = categories.every(c => habitCategories.has(c));
        break;
      }
      case 'perfect_month': {
        // 100% completion for 30 consecutive days
        const { format: fmt2, subDays: sub2 } = require('date-fns');
        let perfectMonth = true;
        for (let i = 0; i < 30; i++) {
          const dayStr = fmt2(sub2(new Date(), i), 'yyyy-MM-dd');
          const dayCompletions = await HabitCompletion.countDocuments({ userId, date: dayStr });
          if (dayCompletions < habits.length || habits.length === 0) { perfectMonth = false; break; }
        }
        earned = perfectMonth;
        break;
      }
    }

    if (earned) {
      try {
        const ua = await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          unlockedAt: new Date(),
          seen: false,
        });
        newAchievements.push({ ...achievement.toObject(), unlockedAt: ua.unlockedAt });
      } catch (e) {
        // Duplicate key = already unlocked, ignore
      }
    }
  }

  return { newAchievements };
}

module.exports = { checkAndAwardAchievements };
