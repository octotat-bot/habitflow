const DailySnapshot = require('../models/DailySnapshot');
const HabitCompletion = require('../models/HabitCompletion');
const Habit = require('../models/Habit');
const { format } = require('date-fns');

async function updateDailySnapshot(userId, date = null) {
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  const [habits, completions] = await Promise.all([
    Habit.find({ userId, isArchived: false }),
    HabitCompletion.find({ userId, date: targetDate }),
  ]);

  const totalHabits = habits.length;
  const completedHabits = completions.length;
  const completionRate = totalHabits > 0
    ? Math.round((completedHabits / totalHabits) * 100)
    : 0;

  const moods = completions.filter(c => c.mood != null).map(c => c.mood);
  const energies = completions.filter(c => c.energy != null).map(c => c.energy);

  const moodAvg = moods.length > 0
    ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
    : null;

  const energyAvg = energies.length > 0
    ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10
    : null;

  const xpEarned = completions.reduce((sum, c) => sum + (c.xpSnap || 0), 0);

  await DailySnapshot.findOneAndUpdate(
    { userId, date: targetDate },
    {
      totalHabits,
      completedHabits,
      completionRate,
      moodAvg,
      energyAvg,
      xpEarned,
    },
    { upsert: true, new: true }
  );
}

module.exports = { updateDailySnapshot };
