/**
 * streakFreezeStore — tracks 1 streak freeze per week per habit.
 * Uses sessionStorage so each browser tab has its own freeze state
 * (matching the tab-isolated auth model — different users in different
 * tabs never share freeze data).
 * Resets every Monday (ISO week boundary).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format, getISOWeek, getYear, startOfWeek, addDays } from 'date-fns';

// Key: "YYYY-W##" (ISO year + week number)
function currentWeekKey() {
  const now = new Date();
  return `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
}

const WEEKLY_FREEZE_LIMIT = 1;

const useStreakFreezeStore = create(
  persist(
    (set, get) => ({
      // { [weekKey]: { [habitId]: dateString } }
      freezeLog: {},

      /** Returns how many freezes this habit has used this week */
      freezesUsedThisWeek(habitId) {
        const wk = currentWeekKey();
        const log = get().freezeLog[wk] || {};
        return log[habitId] ? 1 : 0;
      },

      /** Returns true if this habit is frozen today */
      isFrozenToday(habitId) {
        const wk  = currentWeekKey();
        const log = get().freezeLog[wk] || {};
        return log[habitId] === format(new Date(), 'yyyy-MM-dd');
      },

      /** Returns true if a freeze is still available for this habit this week */
      canFreeze(habitId) {
        return get().freezesUsedThisWeek(habitId) < WEEKLY_FREEZE_LIMIT;
      },

      /** Use a freeze for this habit today */
      useFreeze(habitId) {
        const wk    = currentWeekKey();
        const today = format(new Date(), 'yyyy-MM-dd');
        set(s => ({
          freezeLog: {
            ...s.freezeLog,
            [wk]: { ...(s.freezeLog[wk] || {}), [habitId]: today },
          },
        }));
      },

      /** Undo a freeze for this habit this week */
      undoFreeze(habitId) {
        const wk = currentWeekKey();
        set(s => {
          const weekLog = { ...(s.freezeLog[wk] || {}) };
          delete weekLog[habitId];
          return { freezeLog: { ...s.freezeLog, [wk]: weekLog } };
        });
      },

      /** When does the weekly freeze reset? (Next Monday) */
      getResetDate() {
        const now    = new Date();
        const monday = startOfWeek(now, { weekStartsOn: 1 });
        return format(addDays(monday, 7), 'EEE, MMM d');
      },
    }),
    {
      name: 'hf-streak-freeze',
      // sessionStorage → tab-isolated, matches per-tab auth model
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useStreakFreezeStore;
