import {apiFetch, setToken, clearToken} from './api';

export interface AdminUser {
  id: string;
  role: string;
  fullName: string | null;
}

/** Logs in and rejects if the account is not an admin. */
export async function adminLogin(email: string, password: string) {
  const data = await apiFetch<{user: AdminUser; tokens: {accessToken: string}}>(
    '/auth/login',
    {method: 'POST', body: JSON.stringify({email, password})},
  );
  if (data.user.role !== 'admin') {
    throw new Error('This account is not an admin.');
  }
  setToken(data.tokens.accessToken);
  return data.user;
}

export function adminLogout() {
  clearToken();
}
