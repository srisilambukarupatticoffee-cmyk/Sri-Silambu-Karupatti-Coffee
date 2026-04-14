import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ id: '1', username: 'admin', name: 'Admin', role: 'admin' });
  const [loading, setLoading] = useState(false);

  const login = async () => ({ success: true });
  const logout = () => {};

  const isAdmin = () => true;
  const isBilling = () => false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isBilling, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
