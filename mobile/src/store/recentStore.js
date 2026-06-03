import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@recent_properties';
const MAX = 20;

export const useRecentStore = create((set, get) => ({
  items: [],
  loaded: false,

  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      set({items, loaded: true});
    } catch {
      set({loaded: true});
    }
  },

  async push(property) {
    const prev = get().items.filter(p => p.id !== property.id);
    const next = [{...property, viewedAt: Date.now()}, ...prev].slice(0, MAX);
    set({items: next});
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  },

  async clear() {
    set({items: []});
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  },

  reset() {
    set({items: [], loaded: false});
  },
}));
