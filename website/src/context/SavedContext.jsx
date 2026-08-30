import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {apiFetch} from '../lib/api';
import {useAuth} from './AuthContext';

const SavedContext = createContext({
  savedIds: new Set(),
  count: 0,
  isSaved: () => false,
  toggleSave: async () => false,
  refresh: () => {},
});

/**
 * The visitor's shortlist, kept in one place so the heart on a card, the badge
 * in the navbar and the /saved page can never disagree.
 *
 * Only ids live here — the full listings are fetched by the page that shows
 * them, which keeps this light on every route.
 */
export function SavedProvider({children}) {
  const {user} = useAuth();
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    apiFetch('/properties/saved/mine')
      .then(items => setSavedIds(new Set((items || []).map(p => p.id))))
      .catch(() => setSavedIds(new Set()))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(refresh, [refresh]);

  const isSaved = useCallback(id => savedIds.has(id), [savedIds]);

  /**
   * Optimistic toggle — the heart responds instantly and rolls back if the
   * request fails. Returns false when the visitor isn't signed in, so the
   * caller can send them to the login page.
   */
  const toggleSave = useCallback(
    async id => {
      if (!user) return false;
      const next = !savedIds.has(id);
      setSavedIds(prev => {
        const s = new Set(prev);
        if (next) s.add(id);
        else s.delete(id);
        return s;
      });
      try {
        await apiFetch(`/properties/${id}/save`, {method: next ? 'POST' : 'DELETE'});
      } catch {
        setSavedIds(prev => {
          const s = new Set(prev);
          if (next) s.delete(id);
          else s.add(id);
          return s;
        });
      }
      return true;
    },
    [savedIds, user],
  );

  const value = useMemo(
    () => ({savedIds, count: savedIds.size, isSaved, toggleSave, refresh, loading}),
    [savedIds, isSaved, toggleSave, refresh, loading],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  return useContext(SavedContext);
}
