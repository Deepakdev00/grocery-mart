import React, { useState } from 'react';
import { useAuth, useToast } from '../../context';
import ForgotPasswordModal from './ForgotPasswordModal';

const LoginModal = ({ onClose, onLoginSuccess, initialIsSignUp = false }) => {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, signup } = useAuth();
  const { success, error: showError } = useToast();

  if (showForgotPassword) {
    return (
      <ForgotPasswordModal
        onClose={onClose}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    );
  }

  const handleContinue = async () => {
    setError('');

    if (email.trim().length < 3) {
      setError('Please enter a valid email address');
      showError('Please enter a valid email address');
      return;
    }

    if (isSignUp && username.trim().length < 2) {
      setError('Please enter a username with at least 2 characters');
      showError('Username must be at least 2 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(username, email, password);
        success(`Account created successfully! Welcome ${username}! 🎉`);
      } else {
        await login(email, password);
        success(`Login successful! Welcome back! 👋`);
      }
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.message || 'Something went wrong';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay modal-center">
      <div className="modal-box">
        <span className="close-icon" onClick={onClose}>×</span>

        {/* Dynamic Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {isSignUp ? 'Sign Up' : 'Login'}
          </h3>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            {isSignUp ? 'Create a new account' : 'Log in to continue'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: '#fee',
              color: '#c00',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Sign Up: Username Input */}
        {isSignUp && (
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Enter username"
              className="card-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #0c0b0b',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Email Input */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginTop: '15px', position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0',
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Forgot Password Link (Login mode only) */}
        {!isSignUp && (
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <span
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              style={{
                fontSize: '12px',
                color: '#0aad0a',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              Forgot password?
            </span>
          </div>
        )}

        {/* Continue Button */}
        <button
          className="green-btn"
          onClick={handleContinue}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, marginTop: '15px' }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}
        </button>

        {/* Toggle between Login and Signup */}
        <p style={{ fontSize: '12px', color: '#666', marginTop: '20px', textAlign: 'center' }}>
          {isSignUp ? 'Already have an account? ' : 'New to GroceryMart? '}
          <span
            style={{ color: '#3d17bb', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </span>
        </p>

        <p style={{ fontSize: '10px', color: '#aaa', marginTop: '15px', textAlign: 'center' }}>
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
