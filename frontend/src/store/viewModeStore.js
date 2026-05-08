import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useViewModeStore = create(
  persist(
    (set) => ({
      mode: 'graph', // 'graph' or '3d'
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'graph' ? '3d' : 'graph' })),
    }),
    {
      name: 'view-mode',
    }
  )
);

export default useViewModeStore;
