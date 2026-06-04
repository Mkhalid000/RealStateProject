import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchMe} from '../lib/auth';
import {tokenStore} from '../lib/tokenStore';
import {setOnAuthFailure} from '../lib/api';
import {useAuthStore} from '../store/authStore';

const LAST_USER_KEY = 'rr_last_user';

const lastUserStore = {
  async get() {
    try {
      const v = await AsyncStorage.getItem(LAST_USER_KEY);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  async set(user) {
    try {
      await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
    } catch {}
  },
  async clear() {
    try { await AsyncStorage.removeItem(LAST_USER_KEY); } catch {}
  },
};

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
          lastUserStore.set(me); // cache for offline/network-error fallback
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // 401 = expired token, 403 = deactivated account — clear everything.
          await tokenStore.clear();
          await lastUserStore.clear();
          if (active) setStartAtLogin(true);
        } else {
          // Network error / server unreachable — tokens are still on-device and
          // likely valid. Use a minimal cached identity so the user is not kicked
          // out just because of a connectivity blip. Profile will refresh on the
          // next successful API call (e.g. ProfileScreen useFocusEffect).
          const cached = await lastUserStore.get();
          if (active && cached) setUser(cached);
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
