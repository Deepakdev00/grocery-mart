import React, { useState } from 'react';
import './AdminSidebar.css';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: null },
    { id: 'products', label: 'Products', icon: '🛍️', badge: null },
    { id: 'orders', label: 'Orders', icon: '📦', badge: null },
    { id: 'users', label: 'Users', icon: '👥', badge: null },
    { id: 'support', label: 'Support', icon: '🎫', badge: null },
    { id: 'sessions', label: 'Sessions', icon: '🔐', badge: null },
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="sidebar-label">{item.label}</span>
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`sidebar-info ${isCollapsed ? 'hidden' : ''}`}>
          <p className="sidebar-version">Admin v1.0</p>
          <p className="sidebar-note">Live Data</p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
