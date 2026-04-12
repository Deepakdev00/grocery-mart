import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, cartAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authAPI.getMe();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const signup = async (username, email, password) => {
    const data = await authAPI.signup(username, email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const syncCartToServer = useCallback(async (localCart) => {
    if (isAuthenticated && localCart.length > 0) {
      try {
        await cartAPI.syncCart(localCart);
      } catch (error) {
        console.error('Failed to sync cart:', error);
      }
    }
  }, [isAuthenticated]);

  const value = {
    user,
    loading,
    isAuthenticated,
    signup,
    login,
    logout,
    syncCartToServer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
