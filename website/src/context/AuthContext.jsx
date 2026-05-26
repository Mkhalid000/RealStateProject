import {createContext, useContext, useEffect, useState} from 'react';
import {apiFetch, getToken, setToken, clearToken} from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    apiFetch('/auth/me')
      .then(me => {
        if (me.role === 'admin') setAdmin(me);
        else clearToken();
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    });
    if (data.user.role !== 'admin') {
      throw new Error('This account is not an admin.');
    }
    setToken(data.tokens.accessToken);
    setAdmin(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{admin, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
