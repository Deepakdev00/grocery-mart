import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if admin is already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAdminAuthenticated(true);
      const adminData = localStorage.getItem('adminUser');
      if (adminData) {
        setAdminUser(JSON.parse(adminData));
      }
    }
    setLoading(false);
  }, []);

  const loginAdmin = (username, password) => {
    // Simple admin authentication (in production, use real backend)
    // Default admin credentials
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin123';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminData = { username, role: 'admin' };
      localStorage.setItem('adminToken', 'admin_token_' + Date.now());
      localStorage.setItem('adminUser', JSON.stringify(adminData));
      setIsAdminAuthenticated(true);
      setAdminUser(adminData);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAdminAuthenticated(false);
    setAdminUser(null);
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
