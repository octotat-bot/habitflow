import { format, subDays, parseISO, isValid } from 'date-fns';

export function calculateClientStreak(completionDates) {
  if (!completionDates || completionDates.length === 0) return 0;

  const sorted = [...completionDates]
    .filter(d => isValid(parseISO(d)))
    .sort((a, b) => (a > b ? -1 : 1));

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = sorted[0] === today ? new Date() : subDays(new Date(), 1);

  for (const dateStr of sorted) {
    if (dateStr === format(checkDate, 'yyyy-MM-dd')) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else break;
  }

  return streak;
}

export function getStreakColor(streak) {
  if (streak === 0) return 'var(--text-tertiary)';
  if (streak >= 100) return 'var(--amber)';
  if (streak >= 30) return 'var(--violet)';
  if (streak >= 7) return 'var(--accent)';
  return 'var(--text-secondary)';
}

export function isStreakAtRisk(habit, todayCompletions) {
  const hour = new Date().getHours();
  if (hour < 19) return false;
  const isCompleted = todayCompletions.some(c => String(c.habitId) === String(habit._id));
  return !isCompleted && (habit.currentStreak || 0) > 0;
}

export function getNextMilestone(streak) {
  const milestones = [7, 21, 66, 100, 365];
  return milestones.find(m => m > streak) || null;
}

export function getMilestoneProgress(streak) {
  const next = getNextMilestone(streak);
  if (!next) return 100;
  const prev = [0, 7, 21, 66, 100, 365].reverse().find(m => m <= streak) || 0;
  return Math.round(((streak - prev) / (next - prev)) * 100);
}
