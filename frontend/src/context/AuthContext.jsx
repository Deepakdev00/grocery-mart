import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Session timeout constants
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
const SESSION_WARNING_BEFORE = 2 * 60 * 1000; // Show warning 2 minutes before expiry
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Check token every 5 minutes

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
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const sessionTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const tokenRefreshTimerRef = useRef(null);

  // Derive user role from user object
  const userRole = user?.role || null;

  const handleLogout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Server logout failed:', error.message);
    }

    // Reset all state
    setUser(null);
    setIsAuthenticated(false);
    setShowSessionWarning(false);

    // Clear all timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
  }, []);

  // Reset session timers
  const resetSessionTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowSessionWarning(false);

    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);

    if (!isAuthenticated) return;

    // Set warning timer (fires 2 minutes before session expires)
    warningTimerRef.current = setTimeout(() => {
      setShowSessionWarning(true);
    }, SESSION_TIMEOUT - SESSION_WARNING_BEFORE);

    // Set auto-logout timer
    sessionTimerRef.current = setTimeout(() => {
      console.warn('Session expired due to inactivity');
      handleLogout();
    }, SESSION_TIMEOUT);
  }, [isAuthenticated, handleLogout]);

  // Track user activity for session management
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      resetSessionTimers();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);

    // Initialize timers
    resetSessionTimers();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);

      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [isAuthenticated, resetSessionTimers]);

  // Token refresh logic
  const refreshToken = useCallback(async () => {
    try {
      await authAPI.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }, []);

  // Auto-refresh token on interval
  useEffect(() => {
    if (!isAuthenticated) return;

    tokenRefreshTimerRef.current = setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
    };
  }, [isAuthenticated, refreshToken]);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authAPI.getMe();
        setUser(data.user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (username, email, password) => {
    const data = await authAPI.signup(username, email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  // Dismiss the session warning
  const dismissSessionWarning = useCallback(() => {
    setShowSessionWarning(false);
  }, []);

  // Manually refresh session (reset inactivity timer)
  const refreshSession = useCallback(() => {
    resetSessionTimers();
  }, [resetSessionTimers]);

  // Update user state (e.g., after profile changes)
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    signup,
    login,
    logout: handleLogout,
    userRole,
    showSessionWarning,
    dismissSessionWarning,
    refreshSession,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
