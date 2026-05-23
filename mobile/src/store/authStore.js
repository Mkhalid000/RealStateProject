import {create} from 'zustand';

export const useAuthStore = create(set => ({
  user: null,
  initializing: true,
  setUser: user => set({user}),
  setInitializing: initializing => set({initializing}),
  reset: () => set({user: null}),
}));
