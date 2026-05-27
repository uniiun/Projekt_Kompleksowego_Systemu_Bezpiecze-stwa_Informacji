import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setUser(null);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    apiClient.get('/me/')
      .then((res) => {
        if (!isActive) return;
        setUser(res.data);
      })
      .catch(() => {
        if (!isActive) return;
        setUser(null);
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const login = useCallback((accessToken) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return null;
    }
    const res = await apiClient.get('/me/');
    setUser(res.data);
    return res.data;
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
