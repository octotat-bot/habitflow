import { create } from 'zustand';

const useUIStore = create((set) => ({
  drawerOpen: false,
  drawerMode: 'create', // 'create' | 'edit'
  editingHabit: null,
  focusMode: false,
  activeTab: '/',
  globalLoading: false,

  openDrawer: (mode = 'create', habit = null) =>
    set({ drawerOpen: true, drawerMode: mode, editingHabit: habit }),

  closeDrawer: () =>
    set({ drawerOpen: false, editingHabit: null }),

  toggleFocusMode: () =>
    set(s => ({ focusMode: !s.focusMode })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setGlobalLoading: (v) => set({ globalLoading: v }),
}));

export default useUIStore;
