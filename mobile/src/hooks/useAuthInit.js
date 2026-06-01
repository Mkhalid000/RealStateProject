import {useEffect} from 'react';
import {fetchMe} from '../lib/auth';
import {tokenStore} from '../lib/tokenStore';
import {setOnAuthFailure} from '../lib/api';
import {useAuthStore} from '../store/authStore';

// Roles allowed to use the mobile app. Admins manage things on the website,
// so an admin session is rejected here and routed to Login.
const ALLOWED_ROLES = ['user', 'agent'];

/**
 * On mount: if tokens exist, fetch the current user and validate their role.
 * A blocked role or a failed token refresh clears the session and sends the
 * user straight to Login (rather than the Welcome screen).
 */
export function useAuthInit() {
  const {setUser, setInitializing, setStartAtLogin} = useAuthStore();

  useEffect(() => {
    let active = true;

    setOnAuthFailure(() => {
      if (active) {
        setUser(null);
        setStartAtLogin(true);
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
        // Block disallowed roles (e.g. admin) from the mobile app.
        if (!ALLOWED_ROLES.includes(me?.role)) {
          await tokenStore.clear();
          if (active) {
            setUser(null);
            setStartAtLogin(true);
          }
          return;
        }
        if (active) {
          setUser(me);
        }
      } catch {
        // Expired / invalid token — drop the session and land on Login.
        await tokenStore.clear();
        if (active) {
          setStartAtLogin(true);
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [setUser, setInitializing, setStartAtLogin]);
}
