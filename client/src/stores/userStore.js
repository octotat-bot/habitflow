import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/axios';
import { tabStorage } from '../lib/storage';

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      achievements: [],
      newAchievements: [],
      token: null,
      isAuthenticated: false,
      loading: false,

      setToken: (token) => {
        tabStorage.set('hf_token', token);
        set({ token, isAuthenticated: true });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      fetchUser: async () => {
        set({ loading: true });
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, isAuthenticated: true, loading: false });
        } catch {
          set({ user: null, isAuthenticated: false, token: null, loading: false });
          tabStorage.remove('hf_token');
        }
      },

      updateProfile: async (updates) => {
        const { data } = await api.put('/profile', updates);
        set({ user: data.user });
        return data.user;
      },

      fetchAchievements: async () => {
        try {
          const { data } = await api.get('/achievements');
          set({ achievements: data.achievements });
        } catch (err) {
          console.error('Failed to fetch achievements', err);
        }
      },

      addNewAchievements: (achievements) => {
        set(s => ({
          newAchievements: [...s.newAchievements, ...achievements],
        }));
      },

      clearNewAchievements: async () => {
        set({ newAchievements: [] });
        try {
          await api.patch('/achievements/seen');
        } catch {}
      },

      addXP: (amount) => {
        set(s => ({
          user: s.user ? {
            ...s.user,
            xp: (s.user.xp || 0) + amount,
            weeklyScore: (s.user.weeklyScore || 0) + amount,
          } : null,
        }));
      },

      logout: () => {
        // Only removes THIS tab's token — other tabs are unaffected
        tabStorage.remove('hf_token');
        set({ user: null, token: null, isAuthenticated: false, achievements: [], newAchievements: [], loading: false });
      },
    }),
    {
      name: 'habitflow-user',
      // Use sessionStorage so each tab has independent auth state
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useUserStore;
