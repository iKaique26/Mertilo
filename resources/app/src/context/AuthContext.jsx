import React, { createContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api/client';

export const AuthContext = createContext(null);

const safeTokenGet = () => {
  try {
    return localStorage.getItem('mertilo_token');
  } catch (error) {
    console.warn('[AuthContext] Não foi possível ler o token do armazenamento local:', error);
    return null;
  }
};

const safeTokenRemove = () => {
  try {
    localStorage.removeItem('mertilo_token');
  } catch (error) {
    console.warn('[AuthContext] Não foi possível remover o token do armazenamento local:', error);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => safeTokenGet());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (token) {
        try {
          const me = await apiCall('/auth/me');
          setUser(me);
        } catch (err) {
          safeTokenRemove();
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
    try {
      localStorage.setItem('mertilo_token', res.token);
    } catch (error) {
      console.warn('[AuthContext] Não foi possível salvar o token no armazenamento local:', error);
    }
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (name, email, password, acceptTerms, dateOfBirth) => {
    const res = await apiCall('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, acceptTerms, dateOfBirth }) });
    return res;
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    safeTokenRemove();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
