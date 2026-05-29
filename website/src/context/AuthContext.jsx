import {createContext, useContext, useEffect, useState} from 'react';
import {apiFetch, getToken, setTokens, clearToken} from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    apiFetch('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    });
    setTokens(data.tokens);
    setUser(data.user);
    return data.user;
  }

  // payload: {fullName, email, password, role?, phone?, agencyName?}
  // Returns the created user (auto-login) OR {pendingVerification, message} for agents.
  async function register(payload) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data?.pendingVerification) {
      return data;
    }
    setTokens(data.tokens);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    // convenience flags
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
