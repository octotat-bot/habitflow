import { create } from 'zustand';
import api from '../lib/axios';

const useAIStore = create((set, get) => ({
  coachMessages:        {},   // habitId → string
  weeklyNarrative:      null, // { narrative, weekStart, weekEnd, createdAt }
  autopsyModal:         null, // { habitId, habitName, brokenStreak, message } | null
  ritualDNA:            null,
  habitSuggestions:     [],
  suggestionsError:     null, // null | 'quota' | 'ratelimit' | 'error'
  suggestionsFallback:  false, // true when showing curated (non-AI) picks
  rescheduleSuggestions:[],
  journalInsight:       null, // { insight, createdAt }
  cascadeInsights:      [],
  loadingStates:        {},   // featureKey → boolean

  _setLoading: (key, val) =>
    set(s => ({ loadingStates: { ...s.loadingStates, [key]: val } })),

  // ── Feature 1: Coach Message ────────────────────────────────
  fetchCoachMessage: async (habitId, event) => {
    get()._setLoading(`coach_${habitId}`, true);
    try {
      const { data } = await api.post('/ai/coach', { habitId, event });
      set(s => ({ coachMessages: { ...s.coachMessages, [habitId]: data.message } }));
    } catch {
      set(s => ({ coachMessages: { ...s.coachMessages, [habitId]: 'Keep tracking — patterns reveal themselves over time.' } }));
    } finally {
      get()._setLoading(`coach_${habitId}`, false);
    }
  },

  dismissCoachMessage: (habitId) =>
    set(s => { const m = { ...s.coachMessages }; delete m[habitId]; return { coachMessages: m }; }),

  // ── Feature 2: Parse Habit ──────────────────────────────────
  parseHabit: async (text) => {
    get()._setLoading('parseHabit', true);
    try {
      const { data } = await api.post('/ai/parse-habit', { text });
      return data.habit;
    } catch {
      return null;
    } finally {
      get()._setLoading('parseHabit', false);
    }
  },

  // ── Feature 3: Weekly Narrative ────────────────────────────
  fetchWeeklyNarrative: async () => {
    get()._setLoading('weeklyNarrative', true);
    try {
      const { data } = await api.get('/ai/weekly-narrative');
      if (data.narrative) {
        set({ weeklyNarrative: data });
      } else {
        // Auto-generate
        const { data: gen } = await api.post('/ai/weekly-narrative');
        set({ weeklyNarrative: gen });
      }
    } catch {
      set({ weeklyNarrative: null });
    } finally {
      get()._setLoading('weeklyNarrative', false);
    }
  },

  // ── Feature 4: Autopsy ──────────────────────────────────────
  triggerAutopsy: async (habitId) => {
    get()._setLoading('autopsy', true);
    try {
      const { data } = await api.post('/ai/autopsy', { habitId });
      set({ autopsyModal: { habitId, ...data } });
    } catch {
      // silent fail
    } finally {
      get()._setLoading('autopsy', false);
    }
  },

  dismissAutopsy: () => set({ autopsyModal: null }),

  // ── Feature 5: Ritual DNA ───────────────────────────────────
  fetchRitualDNA: async () => {
    get()._setLoading('ritualDNA', true);
    try {
      const { data } = await api.get('/ai/ritual-dna');
      set({ ritualDNA: data.dna });
    } catch {
      set({ ritualDNA: null });
    } finally {
      get()._setLoading('ritualDNA', false);
    }
  },

  generateRitualDNA: async () => {
    get()._setLoading('generateDNA', true);
    try {
      const { data } = await api.post('/ai/ritual-dna');
      set({ ritualDNA: data.dna });
      return data.dna;
    } catch (err) {
      throw err;
    } finally {
      get()._setLoading('generateDNA', false);
    }
  },

  // ── Feature 6: Reschedule ───────────────────────────────────
  fetchRescheduleSuggestions: async () => {
    get()._setLoading('reschedule', true);
    try {
      const { data } = await api.get('/ai/reschedule-suggestions');
      set({ rescheduleSuggestions: data.suggestions || [] });
    } catch {
      set({ rescheduleSuggestions: [] });
    } finally {
      get()._setLoading('reschedule', false);
    }
  },

  dismissRescheduleSuggestion: (habitId) =>
    set(s => ({ rescheduleSuggestions: s.rescheduleSuggestions.filter(x => String(x.habitId) !== String(habitId)) })),

  // ── Feature 7: Habit Suggestions ────────────────────────────
  fetchHabitSuggestions: async () => {
    get()._setLoading('suggestions', true);
    set({ suggestionsError: null });
    try {
      const { data } = await api.get('/ai/habit-suggestions');
      set({ habitSuggestions: data.suggestions || [], suggestionsError: null, suggestionsFallback: !!data.fallback });
    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.error || '';
      const errType = status === 503 ? (msg.includes('retry in') ? 'ratelimit' : 'quota') : 'error';
      set({ habitSuggestions: [], suggestionsError: errType });
    } finally {
      get()._setLoading('suggestions', false);
    }
  },

  dismissHabitSuggestions: () => set({ habitSuggestions: [], suggestionsError: null, suggestionsFallback: false }),

  // ── Feature 8: Journal Insight ─────────────────────────────
  fetchJournalInsight: async () => {
    get()._setLoading('journalInsight', true);
    try {
      const { data } = await api.get('/ai/journal-insight');
      set({ journalInsight: data });
    } catch {
      set({ journalInsight: null });
    } finally {
      get()._setLoading('journalInsight', false);
    }
  },

  // ── Feature 9: Cascade Detection ───────────────────────────
  fetchCascadeInsights: async () => {
    get()._setLoading('cascade', true);
    try {
      const { data } = await api.get('/ai/cascade-detection');
      set({ cascadeInsights: data.cascades || [] });
    } catch {
      set({ cascadeInsights: [] });
    } finally {
      get()._setLoading('cascade', false);
    }
  },
}));

export default useAIStore;
