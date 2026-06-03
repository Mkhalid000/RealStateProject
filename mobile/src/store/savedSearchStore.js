import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@saved_searches';
const MAX = 10;

export const useSavedSearchStore = create((set, get) => ({
  searches: [],
  loaded: false,

  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const searches = raw ? JSON.parse(raw) : [];
      set({searches, loaded: true});
    } catch {
      set({loaded: true});
    }
  },

  async save(filters) {
    const label = buildLabel(filters);
    const prev = get().searches.filter(s => s.label !== label);
    const next = [{id: Date.now(), label, filters, savedAt: Date.now()}, ...prev].slice(0, MAX);
    set({searches: next});
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  },

  async remove(id) {
    const next = get().searches.filter(s => s.id !== id);
    set({searches: next});
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  },

  async clear() {
    set({searches: []});
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  },
}));

function buildLabel(filters) {
  const parts = [];
  if (filters.query) parts.push(`"${filters.query}"`);
  if (filters.listingType) parts.push(filters.listingType === 'buy' ? 'Buy' : 'Rent');
  if (filters.type) parts.push(filters.type);
  if (filters.bhk) parts.push(`${filters.bhk} BHK`);
  if (filters.priceRange?.label && filters.priceRange.label !== 'Any price') {
    parts.push(filters.priceRange.label);
  }
  return parts.length ? parts.join(' · ') : 'All Properties';
}
