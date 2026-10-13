import { createContext, useContext, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('aupluseUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('aupluseToken') || null);

  const login = async (role, identifier, password) => {
    const credentials = role === 'student'
      ? { role, email: identifier, password }
      : { role, username: identifier, password };
    const response = await api.post('/auth/login', credentials);
    const payload = response.data;

    localStorage.setItem('aupluseToken', payload.token);
    localStorage.setItem('aupluseUser', JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);

    return payload;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    }

    localStorage.removeItem('aupluseToken');
    localStorage.removeItem('aupluseUser');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, login, logout, setUser, setToken }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
