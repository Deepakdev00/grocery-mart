import React, { useState } from 'react';
import { useAuth, useTheme, useToast } from '../../context';
import ForgotPasswordModal from './ForgotPasswordModal';
import './AuthPage.css';

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
  const { isDark, toggleTheme } = useTheme();
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
    <div className="auth-page-overlay">
      <header className="auth-page-header">
        <button className="auth-brand" onClick={onClose} aria-label="Return to Grocery Mart">
          <span className="auth-brand-mark">G</span>
          <span>Grocery<span>Mart</span><small>FRESH, MADE SIMPLE</small></span>
        </button>
        <button
          className="auth-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? '☀' : '☾'}
        </button>
      </header>

      <main className="auth-page-main">
        <section className="auth-card" aria-labelledby="auth-title">
          <button className="auth-back-button" onClick={onClose} aria-label="Go back">←</button>
          <div className="auth-title-block">
            <div className="auth-eyebrow">YOUR NEIGHBORHOOD STORE</div>
            <h1 id="auth-title">
            {isSignUp ? 'Sign Up' : 'Login'}
            </h1>
            <p>{isSignUp ? 'Create your account to get started.' : 'Welcome back. Sign in to continue.'}</p>
          </div>

          {error && <div className="auth-error-message" role="alert">{error}</div>}

          {isSignUp && (
            <label className="auth-field">
              <span>Your name</span>
            <input
              id="auth-username"
              type="text"
              placeholder="How should we call you?"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="name"
              required
            />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>
          <input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          </label>

          <label className="auth-field auth-password-field">
            <span>Password</span>
            <div className="auth-password-control">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="auth-password-toggle"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
            </div>
          </label>

        {!isSignUp && (
          <div className="auth-options-row">
            <span
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setShowForgotPassword(true);
                  setError('');
                }
              }}
            >
              Forgot password?
            </span>
          </div>
        )}

        <button
          className="auth-submit-button"
          onClick={handleContinue}
          disabled={loading || !email.trim() || !password || (isSignUp && !username.trim())}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
        </button>

        <p className="auth-switch-copy">
          {isSignUp ? 'Already have an account? ' : 'New to GroceryMart? '}
          <span
            role="button"
            tabIndex={0}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsSignUp(!isSignUp);
                setError('');
              }
            }}
          >
            {isSignUp ? 'Log in instead' : 'Create one'}
          </span>
        </p>
        <p className="auth-legal-copy">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </section>
      </main>
      <footer className="auth-page-footer">© 2026 Grocery Mart · Fresh, made simple</footer>
    </div>
  );
};

export default LoginModal;
