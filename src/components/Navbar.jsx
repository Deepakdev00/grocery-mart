import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ cartCount, onOpenLogin, onOpenCart, searchQuery, setSearchQuery, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNav = (view) => {
    if (onNavigate) onNavigate(view);
    setIsDropdownOpen(false);
  };

  return (
    <header className="navbar">
      <div className="logo-section" onClick={() => handleNav('home')} style={{cursor: 'pointer'}}>
        <span className="logo-black">Grocery</span><span className="logo-green">Mart</span>
      </div>
      <div className="location-section">
        <div className="delivery-title">Delivery in time</div>
        <div className="delivery-loc">Surat, Gujarat</div>
      </div>
      <div className="search-section">
        <input 
          type="text" 
          placeholder="Search 'chocolate'..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
      <div className="auth-section">
        {isAuthenticated ? (
          <div className="user-dropdown-container" ref={dropdownRef}>
            <button className="user-dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#2d7a4b" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              {user?.name?.split(' ')[0] || 'User'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-item" onClick={() => handleNav('home')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#2d7a4b" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  My Profile
                </div>
                <div className="dropdown-item" onClick={() => handleNav('orders')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#2d7a4b" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 8h-2V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-8-2h2v2h-2V6z"/>
                  </svg>
                  My Orders
                </div>
                <div className="dropdown-item" onClick={() => handleNav('wishlist')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e24056" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  Wishlist
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout-item" onClick={() => {
                  logout();
                  handleNav('home');
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e24056" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="login-text-btn" onClick={onOpenLogin}>Login</button>
        )}
        <button className="my-cart-btn" onClick={onOpenCart}>
          <div className="cart-icon">🛒</div>
          <div className="cart-info">
            <span className="cart-label">My Cart</span>
            <span className="cart-count">{cartCount} items</span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;