import { useEffect, useRef } from 'react';
import useHabitStore from '../stores/habitStore';
import useUserStore from '../stores/userStore';

const POLL_INTERVAL_MS  = 30_000; // 30s background poll
const USER_SYNC_MS      = 120_000; // only re-sync user every 2 min
const DEBOUNCE_MS       = 5_000;   // ignore bursts within 5s

/**
 * Keeps dashboard data fresh in real time.
 *
 * Strategy:
 *  • Poll habits + completions every 30s
 *  • Re-sync user (XP/level) every 2 min
 *  • Instant refetch on tab visibility restored or window focus
 *  • Debounced to avoid bursting requests
 */
export default function useRealtimeSync() {
  const { fetchHabits, fetchTodayCompletions } = useHabitStore();
  const { fetchUser } = useUserStore();

  const lastHabitSync = useRef(0);
  const lastUserSync  = useRef(0);

  const syncHabits = async () => {
    const now = Date.now();
    if (now - lastHabitSync.current < DEBOUNCE_MS) return;
    lastHabitSync.current = now;
    try {
      await Promise.all([fetchHabits(), fetchTodayCompletions()]);
    } catch { /* silent */ }
  };

  const syncUser = async () => {
    const now = Date.now();
    if (now - lastUserSync.current < USER_SYNC_MS) return;
    lastUserSync.current = now;
    try { await fetchUser(); } catch { /* silent */ }
  };

  const syncAll = () => { syncHabits(); syncUser(); };

  useEffect(() => {
    // 1. Background poll — habits every 30s
    const habitInterval = setInterval(syncHabits, POLL_INTERVAL_MS);

    // 2. Tab visibility — immediate full sync when user returns to tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncAll();
    };

    // 3. Window focus — immediate sync when window regains focus
    const onFocus = () => syncAll();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(habitInterval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
}
