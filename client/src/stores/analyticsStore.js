import { create } from 'zustand';
import api from '../lib/axios';

const useAnalyticsStore = create((set) => ({
  overview: null,
  heatmap: [],
  trends: [],
  weekly: {},
  perHabit: {},
  loading: {
    overview: false,
    heatmap: false,
    trends: false,
    weekly: false,
  },

  fetchOverview: async () => {
    set(s => ({ loading: { ...s.loading, overview: true } }));
    try {
      const { data } = await api.get('/analytics/overview');
      set(s => ({ overview: data, loading: { ...s.loading, overview: false } }));
    } catch (err) {
      set(s => ({ loading: { ...s.loading, overview: false } }));
    }
  },

  fetchHeatmap: async () => {
    set(s => ({ loading: { ...s.loading, heatmap: true } }));
    try {
      const { data } = await api.get('/analytics/heatmap');
      set(s => ({ heatmap: data.heatmap, loading: { ...s.loading, heatmap: false } }));
    } catch {
      set(s => ({ loading: { ...s.loading, heatmap: false } }));
    }
  },

  fetchTrends: async () => {
    set(s => ({ loading: { ...s.loading, trends: true } }));
    try {
      const { data } = await api.get('/analytics/trends');
      set(s => ({ trends: data.trends, loading: { ...s.loading, trends: false } }));
    } catch {
      set(s => ({ loading: { ...s.loading, trends: false } }));
    }
  },

  fetchWeekly: async () => {
    set(s => ({ loading: { ...s.loading, weekly: true } }));
    try {
      const { data } = await api.get('/analytics/weekly');
      set(s => ({ weekly: data.weekly, loading: { ...s.loading, weekly: false } }));
    } catch {
      set(s => ({ loading: { ...s.loading, weekly: false } }));
    }
  },

  fetchPerHabit: async (id) => {
    try {
      const { data } = await api.get(`/analytics/habit/${id}`);
      set(s => ({ perHabit: { ...s.perHabit, [id]: data } }));
      return data;
    } catch (err) {
      console.error('Failed to fetch per-habit analytics', err);
    }
  },
}));

export default useAnalyticsStore;
