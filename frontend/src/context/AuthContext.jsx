import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ezfinanz_token') || null);
  const [loading, setLoading] = useState(true);
  const fetchedTokenRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        fetchedTokenRef.current = null;
        return;
      }

      // Skip duplicate /auth/me if user is already set for this token
      if (fetchedTokenRef.current === token && user) {
        setLoading(false);
        return;
      }

      try {
        fetchedTokenRef.current = token;
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const loginSuccess = (tokenData, userData) => {
    localStorage.setItem('ezfinanz_token', tokenData);
    fetchedTokenRef.current = tokenData;
    setToken(tokenData);
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('ezfinanz_token');
    fetchedTokenRef.current = null;
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginSuccess, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

