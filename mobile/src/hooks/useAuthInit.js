import {useEffect} from 'react';
import {fetchMe} from '../lib/auth';
import {tokenStore} from '../lib/tokenStore';
import {setOnAuthFailure} from '../lib/api';
import {useAuthStore} from '../store/authStore';

/**
 * On mount: if tokens exist, fetch the current user. Also registers a hard-logout
 * handler so a failed token refresh clears the session.
 */
export function useAuthInit() {
  const {setUser, setInitializing} = useAuthStore();

  useEffect(() => {
    let active = true;

    setOnAuthFailure(() => {
      if (active) {
        setUser(null);
      }
    });

    (async () => {
      const tokens = await tokenStore.get();
      if (!tokens) {
        if (active) {
          setInitializing(false);
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (active) {
          setUser(me);
        }
      } catch {
        await tokenStore.clear();
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [setUser, setInitializing]);
}
