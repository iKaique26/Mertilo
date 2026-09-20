import React, { createContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mertilo_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (token) {
        try {
          const me = await apiCall('/auth/me');
          setUser(me);
        } catch (err) {
          localStorage.removeItem('mertilo_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    init();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('mertilo_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await apiCall('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    return res;
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('mertilo_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
