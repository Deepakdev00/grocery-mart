import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useTheme, useToast } from '../../context';
import { profileAPI } from '../../services/api';

const Navbar = ({
  cartCount,
  onOpenLogin,
  onOpenSignUp,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onNavigate,
  activeView = 'home'
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { error: showError } = useToast();
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

  const handleThemeToggle = async () => {
    const nextTheme = isDark ? 'light' : 'dark';
    if (isAuthenticated && user?.role === 'customer') {
      try {
        await profileAPI.updateTheme(nextTheme);
      } catch (error) {
        showError(error.message || 'Could not save your theme preference.');
        return;
      }
    }
    setTheme(nextTheme);
  };

  return (
    <header className="navbar">
      {/* Brand Logo & Location */}
      <div className="nav-brand-section">
        <div
          className="logo-section"
          onClick={() => handleNav(isAuthenticated ? 'home' : 'about')}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-black">Grocery</span><span className="logo-green">Mart</span>
        </div>
        <div className="location-section">
          <div className="delivery-title">⚡ 10 Min Delivery</div>
          <div className="delivery-loc">Surat, Gujarat</div>
        </div>
      </div>

      {/* Main Nav Links: Home (if logged in), About Us, Contact Us */}
      <nav className="nav-links-section">
        {isAuthenticated && user?.role === 'customer' && (
          <button
            className={`nav-link-btn ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            Home
          </button>
        )}
        <button
          className={`nav-link-btn ${activeView === 'about' ? 'active' : ''}`}
          onClick={() => handleNav('about')}
        >
          About Us
        </button>
        <button
          className={`nav-link-btn ${activeView === 'contact' ? 'active' : ''}`}
          onClick={() => handleNav('contact')}
        >
          Contact Us
        </button>
        <button
          className={`nav-link-btn ${activeView === 'admin' ? 'active' : ''}`}
          onClick={() => handleNav('admin')}
        >
          Admin Login
        </button>
      </nav>

      {/* Search Bar - visible only when logged in */}
      {isAuthenticated && user?.role === 'customer' && (
        <div className="search-section">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search fresh vegetables, fruits, dairy, snacks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'home') handleNav('home');
              }}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>
      )}

      {/* Right Controls: Theme Toggle, Auth, Cart */}
      <div className="auth-section">
        {/* Dark / Light Theme Toggle */}
        <button
          className="theme-toggle-nav-btn"
          onClick={handleThemeToggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          <span className="theme-toggle-icon">{isDark ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-text">{isDark ? 'Light' : 'Dark'}</span>
        </button>

        {isAuthenticated ? (
          <div className="user-dropdown-container" ref={dropdownRef}>
            <button className="user-dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="user-avatar-pill">
                {user?.profile?.profileImage ? (
                  <img src={user.profile.profileImage} alt="User" className="user-avatar-img" />
                ) : (
                  <span className="user-avatar-letter">
                    {(user?.username || user?.name || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="user-name-text">
                {(user?.username || user?.name || 'Account').split(' ')[0]}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <div className="dropdown-user-name">{user?.username || user?.name || 'Valued Customer'}</div>
                  <div className="dropdown-user-email">{user?.email}</div>
                  {user?.role && (
                    <div style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      backgroundColor: user.role === 'admin' ? '#e0e7ff' : '#dcfce7',
                      color: user.role === 'admin' ? '#3730a3' : '#15803d'
                    }}>
                      {user.role}
                    </div>
                  )}
                </div>
                <div className="dropdown-divider"></div>

                <div className="dropdown-item" onClick={() => handleNav('profile')}>
                  <span className="dropdown-icon">👤</span>
                  <span>My Profile & Settings</span>
                </div>
                {user?.role === 'customer' && (
                  <>
                    <div className="dropdown-item" onClick={() => handleNav('orders')}>
                      <span className="dropdown-icon">📦</span>
                      <span>My Orders</span>
                    </div>
                    <div className="dropdown-item" onClick={() => handleNav('wishlist')}>
                      <span className="dropdown-icon">💖</span>
                      <span>My Wishlist</span>
                    </div>
                  </>
                )}
                <div className="dropdown-item" onClick={() => handleNav('support')}>
                  <span className="dropdown-icon">🎫</span>
                  <span>Help & Support Center</span>
                </div>

                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout-item" onClick={() => {
                  logout();
                  handleNav('about');
                }}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="nav-auth-buttons">
            <button className="login-text-btn" onClick={() => onOpenLogin && onOpenLogin(false)}>
              Login
            </button>
            <button className="signup-nav-btn" onClick={() => onOpenSignUp ? onOpenSignUp() : onOpenLogin(true)}>
              Sign Up
            </button>
          </div>
        )}

        {/* My Cart Button - Authenticated Only */}
        {isAuthenticated && user?.role === 'customer' && (
          <button className="my-cart-btn" onClick={onOpenCart}>
            <div className="cart-icon">🛒</div>
            <div className="cart-info">
              <span className="cart-label">My Cart</span>
              <span className="cart-count">{cartCount} items</span>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
