const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'rr_token';
const REFRESH_KEY = 'rr_refresh';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(tokens) {
  if (tokens?.accessToken) localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  if (tokens?.refreshToken) localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Single in-flight refresh shared across concurrent 401s.
let refreshPromise = null;

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refreshToken}),
    });
    if (!res.ok) return null;
    const tokens = await res.json(); // {accessToken, refreshToken}
    setTokens(tokens);
    return tokens.accessToken || null;
  } catch {
    return null;
  }
}

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}, retry = false) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Never try to refresh off the auth endpoints themselves (avoids loops).
    const noRefresh =
      path.includes('/auth/refresh') ||
      path.includes('/auth/login') ||
      path.includes('/auth/register');

    if (!retry && !noRefresh) {
      const fresh = await refreshOnce();
      if (fresh) {
        return apiFetch(path, options, true); // replay once with the new token
      }
    }

    // Refresh unavailable/failed → session is really over.
    clearToken();
    if (!path.includes('/auth/')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined;
  return res.json();
}
