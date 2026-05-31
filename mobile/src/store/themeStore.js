import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rr_theme_mode';

/**
 * App theme mode store. Persists the user's choice (dark default) to
 * AsyncStorage so it survives restarts. `hydrate()` is called once on app
 * launch; until then `mode` stays at the dark default to avoid a flash.
 */
export const useThemeStore = create((set, get) => ({
  mode: 'dark', // 'dark' | 'light'
  hydrated: false,

  async hydrate() {
    try {
      const v = await AsyncStorage.getItem(KEY);
      if (v === 'light' || v === 'dark') {
        set({mode: v});
      }
    } catch {
      // ignore — keep default
    } finally {
      set({hydrated: true});
    }
  },

  setMode(mode) {
    set({mode});
    AsyncStorage.setItem(KEY, mode).catch(() => {});
  },

  toggle() {
    get().setMode(get().mode === 'dark' ? 'light' : 'dark');
  },
}));
