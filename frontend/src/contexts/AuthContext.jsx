import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { getStoredToken, getStoredUser, setStoredAuth, updateStoredUser, clearStoredAuth } from '../lib/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from session/localStorage on mount & refresh from backend
  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();
    
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        setUser(savedUser);
      }

      // Fetch fresh user details (including avatarUrl) from server
      apiClient.get('/auth/me')
        .then(res => {
          if (res.data?.data) {
            const freshUser = res.data.data;
            setUser(freshUser);
            updateStoredUser(freshUser);
          }
        })
        .catch(err => {
          console.warn('Backend user refresh notice:', err.message);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: userData, token: newToken } = response.data.data;
      
      setStoredAuth(newToken, userData, rememberMe);
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API warning:', e.message);
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
    }
  };

  const register = async (data, rememberMe = false) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      
      // If registration requires approval, do not set token or active session
      if (response.data.requiresApproval) {
        return {
          success: true,
          requiresApproval: true,
          message: response.data.message || 'Registration submitted! Awaiting approval before login.',
          user: response.data.data?.user
        };
      }

      const { user: userData, token: newToken } = response.data.data;
      
      setStoredAuth(newToken, userData, rememberMe);
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      updateStoredUser(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
