import React from 'react';
import { useAdmin } from '../../context';
import './AdminNavbar.css';

const AdminNavbar = ({ onLogout }) => {
  const { adminUser } = useAdmin();

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-left">
        <div className="admin-logo">
          <span className="admin-logo-icon">G</span>
          <span className="admin-logo-text">Grocery<span>Mart</span><small>ADMIN CONSOLE</small></span>
        </div>
      </div>

      <div className="admin-navbar-right">
        <span className="admin-header-label">Store administration</span>
        <div className="admin-user-info">
          <div className="admin-avatar" aria-hidden="true">
            {(adminUser?.username || 'A').trim().charAt(0).toUpperCase()}
          </div>
          <div className="admin-user-details">
            <p className="admin-username">{adminUser?.username || 'Administrator'}</p>
            <p className="admin-role">Administrator</p>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
