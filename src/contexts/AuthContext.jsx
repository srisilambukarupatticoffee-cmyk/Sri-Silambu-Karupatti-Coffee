import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const users = await db.getAll('users');
      const found = users.find(u => u.username === username && u.password === password);
      if (found) {
        const userData = { id: found.id, username: found.username, name: found.name, role: found.role };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      return { success: false, error: 'Database connection failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const isAdmin = () => user?.role === 'admin';
  const isBilling = () => user?.role === 'billing';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isBilling, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
