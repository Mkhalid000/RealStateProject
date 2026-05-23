import axios from 'axios';
import {API_URL} from '@env';
import {tokenStore} from './tokenStore';

export const api = axios.create({baseURL: API_URL, timeout: 15000});

// Callback set by the auth layer to react to a hard logout (refresh failed).
let onAuthFailure = null;
export function setOnAuthFailure(cb) {
  onAuthFailure = cb;
}

// Attach the access token to every request.
api.interceptors.request.use(async config => {
  const tokens = await tokenStore.get();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// On 401, try a single refresh, then replay the original request.
let refreshing = null;

async function refreshAccessToken() {
  const tokens = await tokenStore.get();
  if (!tokens?.refreshToken) {
    return null;
  }
  try {
    const {data} = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: tokens.refreshToken,
    });
    await tokenStore.set(data);
    return data.accessToken;
  } catch {
    await tokenStore.clear();
    onAuthFailure?.();
    return null;
  }
}

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-friendly message from an Axios error. */
export function apiErrorMessage(e, fallback = 'Something went wrong') {
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) {
    return msg.join(', ');
  }
  return msg || e?.message || fallback;
}
