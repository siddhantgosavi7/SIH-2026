import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [session, setSession] = useState(JSON.parse(localStorage.getItem('session') || 'null'));
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');

  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? auth : {}) },
    });
    const data = await res.json().catch(() => ({}));
    const detailMsg = Array.isArray(data.detail)
      ? data.detail.map((d) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ')
      : typeof data.detail === 'string'
      ? data.detail
      : typeof data.detail === 'object' && data.detail !== null
      ? JSON.stringify(data.detail)
      : 'Request failed';
    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      throw new Error(detailMsg);
    }
    return data;
  }

  async function load() {
    if (!token) return;
    try {
      const list = await api('/complaints');
      setCases(list);
      if (session?.role !== 'student') {
        setStats(await api('/dashboard/department'));
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => {
    if (token) {
      load().catch((err) => setMessage(err.message));
    } else {
      setCases([]);
      setStats(null);
    }
  }, [token]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  function logout() {
    localStorage.clear();
    setToken('');
    setSession(null);
    setCases([]);
    setStats(null);
  }

  const value = {
    token,
    setToken,
    session,
    setSession,
    cases,
    stats,
    message,
    setMessage,
    api,
    load,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
