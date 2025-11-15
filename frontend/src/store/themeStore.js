import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'system', // 'light', 'dark', or 'system'
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-mode',
    }
  )
);

export default useThemeStore;
