import { useMemo } from 'react';
import { calculateClientStreak, isStreakAtRisk, getNextMilestone, getMilestoneProgress } from '../lib/streakUtils';

/**
 * useHabitStreak - derives streak display data for a habit
 */
export function useHabitStreak(habit, todayCompletions, allCompletionDates = []) {
  return useMemo(() => {
    if (!habit) return { streak: 0, atRisk: false, nextMilestone: null, milestoneProgress: 0 };

    const streak = habit.currentStreak || 0;
    const atRisk = isStreakAtRisk(habit, todayCompletions);
    const nextMilestone = getNextMilestone(streak);
    const milestoneProgress = getMilestoneProgress(streak);

    return { streak, atRisk, nextMilestone, milestoneProgress };
  }, [habit, todayCompletions]);
}

export default useHabitStreak;
