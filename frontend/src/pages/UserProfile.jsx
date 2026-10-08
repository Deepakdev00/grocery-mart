import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast, useTheme } from '../context';
import { profileAPI } from '../services/api';
import { ActiveSessions } from '../features/auth';
import './UserProfile.css';

const UserProfile = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  // Profile Info
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await profileAPI.get();
      if (data.user?.profile) {
        setPhoneNumber(data.user.profile.phoneNumber || '');
        setProfileImage(data.user.profile.profileImage || '');
        if (data.user.profile.theme) {
          setTheme(data.user.profile.theme);
        }
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  }, [setTheme]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async () => {
    setLoading(true);
    try {
      await profileAPI.update({ phoneNumber, profileImage });
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to update profile', 'error');
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await profileAPI.changePassword({ currentPassword, newPassword, confirmPassword });
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      addToast(error.message || 'Failed to change password', 'error');
    }
    setLoading(false);
  };

  const handleThemeChange = async (newTheme) => {
    try {
      await profileAPI.updateTheme(newTheme);
      setTheme(newTheme);
      addToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
    } catch (error) {
      addToast(error.message || 'Could not update the theme', 'error');
    }
  };

  const deleteAccount = async () => {
    const password = prompt('Enter your password to confirm account deletion:');
    if (!password) return;

    const confirm = window.confirm('Are you sure? This cannot be undone. All your orders, cart, and profile data will be permanently deleted.');
    if (!confirm) return;

    setLoading(true);
    try {
      await profileAPI.deleteAccount(password);
      addToast('Account deleted successfully', 'success');
      logout();
      onBack();
    } catch (error) {
      addToast(error.message || 'Failed to delete account', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <button className="back-btn" onClick={onBack}>← Back to Store</button>
        <h1>My Profile & Settings</h1>
        <button className="logout-btn" onClick={() => { logout(); onBack(); }}>Logout</button>
      </div>

      <div className="profile-container">
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            👤 Profile Details
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Security & Password
          </button>
          <button
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            📱 Active Sessions
          </button>
          <button
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            🎨 Appearance & Theme
          </button>
          <button
            className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            🔒 Privacy & Account
          </button>
        </div>

        <div className="profile-content">
          {/* Profile Tab */}
          {activeTab === 'info' && (
            <div className="tab-content">
              <h2>Profile Information</h2>

              <div className="profile-section">
                <div className="user-info">
                  <div className="avatar">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="avatar-placeholder">{(user?.username || 'U')[0]?.toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-details">
                    <p><strong>Username:</strong> {user?.username}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Status:</strong> Verified Customer ✨</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Profile Image URL</label>
                  <input
                    type="text"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <button
                  className="save-btn"
                  onClick={updateProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving Changes...' : '💾 Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Change Account Password</h2>

              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                className="save-btn"
                onClick={changePassword}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : '🔒 Update Password'}
              </button>
            </div>
          )}

          {/* Active Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="tab-content">
              <ActiveSessions />
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="tab-content">
              <h2>Theme & Display Settings</h2>

              <div className="theme-section">
                <h3>Global Website Theme</h3>
                <p>Choose your preferred color theme. Changes apply across the entire application instantly.</p>

                <div className="theme-toggle">
                  <button
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    ☀️ Light Mode
                  </button>
                  <button
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    🌙 Dark Mode
                  </button>
                </div>

                <div className="theme-preview-box">
                  <span>Current Active Theme: <strong>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="tab-content">
              <h2>Privacy & Danger Zone</h2>

              <div className="privacy-section">
                <div className="privacy-item">
                  <h3>Delete Account Permanently</h3>
                  <p>Permanently remove your account and all associated order history, saved addresses, and profile info. This cannot be undone.</p>
                  <button
                    className="delete-btn"
                    onClick={deleteAccount}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : '🗑️ Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
