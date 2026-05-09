import { create } from 'zustand';
import api from '../lib/axios';
import { format } from 'date-fns';

const useHabitStore = create((set, get) => ({
  habits: [],
  todayCompletions: [],
  loading: false,
  error: null,

  fetchHabits: async () => {
    // Only show skeleton on initial load — background polls update silently
    const hasData = get().habits.length > 0;
    if (!hasData) set({ loading: true, error: null });
    try {
      const { data } = await api.get('/habits');
      set({ habits: data.habits, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch habits', loading: false });
    }
  },

  fetchTodayCompletions: async () => {
    try {
      const { data } = await api.get('/completions/today');
      set({ todayCompletions: data.completions });
    } catch (err) {
      console.error('Failed to fetch today completions', err);
    }
  },

  addHabit: async (habitData) => {
    const { data } = await api.post('/habits', habitData);
    set(state => ({ habits: [...state.habits, data.habit] }));
    return data.habit;
  },

  updateHabit: async (id, updates) => {
    const { data } = await api.put(`/habits/${id}`, updates);
    set(state => ({
      habits: state.habits.map(h => h._id === id ? data.habit : h),
    }));
    return data.habit;
  },

  deleteHabit: async (id) => {
    await api.delete(`/habits/${id}`);
    set(state => ({ habits: state.habits.filter(h => h._id !== id) }));
  },

  archiveHabit: async (id) => {
    const { data } = await api.patch(`/habits/${id}/archive`);
    set(state => ({
      habits: state.habits.map(h => h._id === id ? data.habit : h),
    }));
    return data.habit;
  },

  pinHabit: async (id) => {
    const { data } = await api.patch(`/habits/${id}/pin`);
    set(state => ({
      habits: state.habits.map(h => h._id === id ? data.habit : h),
    }));
  },

  markComplete: async (habitId, date, meta = {}) => {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Optimistic update
    const tempCompletion = {
      _id: `temp_${Date.now()}`,
      habitId,
      date: date || today,
      completedAt: new Date().toISOString(),
      ...meta,
    };

    set(state => ({
      todayCompletions: [...state.todayCompletions, tempCompletion],
      habits: state.habits.map(h =>
        h._id === habitId
          ? { ...h, currentStreak: (h.currentStreak || 0) + 1, totalCompletions: (h.totalCompletions || 0) + 1 }
          : h
      ),
    }));

    try {
      const { data } = await api.post('/completions', {
        habitId,
        date: date || today,
        ...meta,
      });

      // Replace temp with real
      set(state => ({
        todayCompletions: state.todayCompletions.map(c =>
          c._id === tempCompletion._id ? data.completion : c
        ),
        habits: state.habits.map(h =>
          h._id === habitId ? { ...h, currentStreak: data.streak } : h
        ),
      }));

      return data;
    } catch (err) {
      // Revert optimistic update
      set(state => ({
        todayCompletions: state.todayCompletions.filter(c => c._id !== tempCompletion._id),
        habits: state.habits.map(h =>
          h._id === habitId
            ? { ...h, currentStreak: Math.max(0, (h.currentStreak || 0) - 1) }
            : h
        ),
      }));
      throw err;
    }
  },

  undoComplete: async (completionId, habitId) => {
    // Optimistic remove
    set(state => ({
      todayCompletions: state.todayCompletions.filter(c => c._id !== completionId),
      habits: state.habits.map(h =>
        h._id === habitId
          ? { ...h, currentStreak: Math.max(0, (h.currentStreak || 0) - 1) }
          : h
      ),
    }));

    try {
      const { data } = await api.delete(`/completions/${completionId}`);
      set(state => ({
        habits: state.habits.map(h =>
          h._id === habitId ? { ...h, currentStreak: data.newStreak } : h
        ),
      }));
    } catch (err) {
      // Refetch to repair state
      get().fetchTodayCompletions();
      get().fetchHabits();
    }
  },

  reorderHabits: async (orderedIds) => {
    // Optimistic
    const currentHabits = get().habits;
    const reordered = orderedIds
      .map(id => currentHabits.find(h => h._id === id))
      .filter(Boolean);
    set({ habits: reordered });

    try {
      await api.patch('/habits/reorder', { orderedIds });
    } catch {
      set({ habits: currentHabits });
    }
  },
}));

export default useHabitStore;
