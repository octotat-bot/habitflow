const { format, subDays, parseISO, isValid, getDay } = require('date-fns');

/**
 * calculateDailyStreak
 * Given sorted completion date strings (desc), count consecutive days ending today or yesterday.
 */
function calculateDailyStreak(completionDates) {
  if (!completionDates || completionDates.length === 0) return 0;

  const sorted = [...completionDates]
    .map(d => d.trim())
    .filter(d => isValid(parseISO(d)))
    .sort((a, b) => (a > b ? -1 : 1));

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Streak must include today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = sorted[0] === today ? new Date() : subDays(new Date(), 1);

  for (const dateStr of sorted) {
    const expected = format(checkDate, 'yyyy-MM-dd');
    if (dateStr === expected) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * calculateWeeklyStreak
 * For x_per_week habits — count consecutive ISO weeks where completions >= timesPerWeek.
 */
function calculateWeeklyStreak(completionDates, timesPerWeek) {
  if (!completionDates || completionDates.length === 0) return 0;

  const { getISOWeek, getISOWeekYear, startOfISOWeek, subWeeks } = require('date-fns');

  // Group by ISO week
  const weekMap = {};
  for (const dateStr of completionDates) {
    const d = parseISO(dateStr);
    if (!isValid(d)) continue;
    const key = `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
    weekMap[key] = (weekMap[key] || 0) + 1;
  }

  let streak = 0;
  let checkWeek = new Date();

  // Check current week and go backwards
  for (let i = 0; i < 104; i++) {
    const wk = getISOWeek(checkWeek);
    const yr = getISOWeekYear(checkWeek);
    const key = `${yr}-W${String(wk).padStart(2, '0')}`;
    if ((weekMap[key] || 0) >= timesPerWeek) {
      streak++;
      checkWeek = subWeeks(checkWeek, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * isAtRisk
 * Returns true if daily habit has no completion today AND it's past 7pm local time.
 */
function isAtRisk(habit, completionDatesForHabit, now = new Date()) {
  if (habit.frequency !== 'daily' && habit.frequency !== 'weekdays' && habit.frequency !== 'weekends') {
    return false;
  }

  const todayStr = format(now, 'yyyy-MM-dd');
  const hasCompletionToday = completionDatesForHabit.includes(todayStr);
  if (hasCompletionToday) return false;

  const hour = now.getHours();
  if (hour < 19) return false;

  // Check if today is a scheduled day
  const dayOfWeek = getDay(now); // 0=Sun
  if (habit.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return false;
  if (habit.frequency === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) return false;

  return habit.currentStreak > 0;
}

/**
 * shouldAutoFreeze
 * Returns true if a streak would break today and auto-freeze is enabled and user has freezes.
 */
function shouldAutoFreeze(habit, user, completionDatesForHabit) {
  if (!user.autoFreeze) return false;
  if (user.streakFreezes <= 0) return false;
  if (habit.currentStreak === 0) return false;

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const hasToday = completionDatesForHabit.includes(today);
  const hasYesterday = completionDatesForHabit.includes(yesterday);

  // Would break if no completion today and current streak is based on yesterday
  return !hasToday && hasYesterday;
}

/**
 * calculateStreakAfterCompletion
 * Returns new streak and any milestone hit.
 */
function calculateStreakAfterCompletion(completionDates, newDate) {
  const allDates = [...new Set([...completionDates, newDate])];
  const newStreak = calculateDailyStreak(allDates);

  const milestones = [7, 21, 66, 100, 365];
  const milestone = milestones.find(m => newStreak === m) || null;

  return { streak: newStreak, milestone };
}

/**
 * getMissedDates
 * Returns array of YYYY-MM-DD strings that were missed between startDate and yesterday.
 */
function getMissedDates(completionDates, startDate, frequency = 'daily') {
  const { eachDayOfInterval, parseISO, getDay } = require('date-fns');
  const start = parseISO(startDate);
  const end = subDays(new Date(), 1);

  if (end < start) return [];

  const allDays = eachDayOfInterval({ start, end });
  const missed = [];

  for (const day of allDays) {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = getDay(day);

    let isScheduled = false;
    if (frequency === 'daily') isScheduled = true;
    else if (frequency === 'weekdays') isScheduled = dayOfWeek >= 1 && dayOfWeek <= 5;
    else if (frequency === 'weekends') isScheduled = dayOfWeek === 0 || dayOfWeek === 6;

    if (isScheduled && !completionDates.includes(dayStr)) {
      missed.push(dayStr);
    }
  }

  return missed;
}

module.exports = {
  calculateDailyStreak,
  calculateWeeklyStreak,
  isAtRisk,
  shouldAutoFreeze,
  calculateStreakAfterCompletion,
  getMissedDates,
};
