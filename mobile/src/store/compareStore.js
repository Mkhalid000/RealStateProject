import {create} from 'zustand';

const MAX = 3;

export const useCompareStore = create((set, get) => ({
  items: [],

  toggle(property) {
    const {items} = get();
    const exists = items.find(p => p.id === property.id);
    if (exists) {
      set({items: items.filter(p => p.id !== property.id)});
    } else if (items.length < MAX) {
      set({items: [...items, property]});
    }
  },

  remove(id) {
    set({items: get().items.filter(p => p.id !== id)});
  },

  clear() {
    set({items: []});
  },

  isSelected(id) {
    return get().items.some(p => p.id === id);
  },

  isFull() {
    return get().items.length >= MAX;
  },
}));
