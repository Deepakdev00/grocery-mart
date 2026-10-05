import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    adminAPI.getMe()
      .then(({ admin }) => {
        if (!isCurrent) return;
        setIsAdminAuthenticated(true);
        setAdminUser(admin);
      })
      .catch(() => {
        if (!isCurrent) return;
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => { isCurrent = false; };
  }, []);

  const loginAdmin = async (email, password) => {
    const { admin } = await adminAPI.login(email, password);
    setIsAdminAuthenticated(true);
    setAdminUser(admin);
    return { success: true, admin };
  };

  const logoutAdmin = async () => {
    try {
      await adminAPI.logout();
    } finally {
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        adminUser,
        loading,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
