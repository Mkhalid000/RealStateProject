import {create} from 'zustand';
import {
  fetchSavedProperties,
  saveProperty,
  unsaveProperty,
} from '../lib/properties';

/** Normalises the saved endpoint (array OR {items}) into an id list + items. */
function normalize(res) {
  const items = Array.isArray(res) ? res : res?.items ?? [];
  return items;
}

export const useSavedStore = create((set, get) => ({
  ids: new Set(),
  items: [],
  loaded: false,

  async load() {
    try {
      const res = await fetchSavedProperties();
      const items = normalize(res);
      set({items, ids: new Set(items.map(p => p.id)), loaded: true});
    } catch {
      set({loaded: true});
    }
  },

  isSaved(id) {
    return get().ids.has(id);
  },

  /** Optimistic toggle; reverts on failure. */
  async toggle(property) {
    const id = property.id;
    const {ids, items} = get();
    const wasSaved = ids.has(id);
    const nextIds = new Set(ids);

    if (wasSaved) {
      nextIds.delete(id);
      set({ids: nextIds, items: items.filter(p => p.id !== id)});
    } else {
      nextIds.add(id);
      set({ids: nextIds, items: [property, ...items]});
    }

    try {
      await (wasSaved ? unsaveProperty(id) : saveProperty(id));
    } catch {
      // revert
      const revert = new Set(get().ids);
      if (wasSaved) {
        revert.add(id);
        set({ids: revert, items: [property, ...get().items]});
      } else {
        revert.delete(id);
        set({ids: revert, items: get().items.filter(p => p.id !== id)});
      }
    }
  },

  reset() {
    set({ids: new Set(), items: [], loaded: false});
  },
}));
