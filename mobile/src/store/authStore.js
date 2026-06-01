import {create} from 'zustand';

export const useAuthStore = create(set => ({
  user: null,
  initializing: true,
  // True when a stored session existed but couldn't be used (expired/invalid
  // token, or a blocked role) — the auth flow then lands on Login, not Welcome.
  startAtLogin: false,
  setUser: user => set({user}),
  setInitializing: initializing => set({initializing}),
  setStartAtLogin: startAtLogin => set({startAtLogin}),
  reset: () => set({user: null}),
}));
