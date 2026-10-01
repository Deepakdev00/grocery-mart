import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context';

const SessionWarning = () => {
  const { showSessionWarning, dismissSessionWarning, refreshSession, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (!showSessionWarning) {
      setTimeLeft(120);
      return;
    }

    setTimeLeft(120);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSessionWarning, logout]);

  if (!showSessionWarning) {
    return null;
  }

  const handleStaySignedIn = () => {
    dismissSessionWarning();
    refreshSession();
  };

  const handleLogout = () => {
    logout();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTimerColor = (seconds) => {
    if (seconds > 60) return '#0aad0a';
    if (seconds > 20) return '#f59e0b';
    return '#dc2626';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '10px',
            lineHeight: '1',
          }}
        >
          ⚠️
        </div>

        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⏳</span> Session Expiring Soon
        </h3>

        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '15px',
            color: '#4b5563',
            lineHeight: '1.4',
          }}
        >
          Your session will expire in
        </p>

        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: getTimerColor(timeLeft),
            margin: '12px 0',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '1px',
            transition: 'color 0.3s ease',
          }}
        >
          {formatTime(timeLeft)}
        </div>

        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          due to inactivity
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleStaySignedIn}
            style={{
              flex: 1,
              backgroundColor: '#0aad0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(10, 173, 10, 0.2)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#088a08')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0aad0a')}
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: '#4b5563',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#4b5563';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;
