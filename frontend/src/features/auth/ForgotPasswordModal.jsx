import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from '../../services';
import { useToast } from '../../context';

const ForgotPasswordModal = ({ onClose, onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(120);

  const otpInputRefs = useRef([]);
  const { success, error: showError } = useToast();

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, otpTimer]);

  // Focus first OTP input on step 2 entry
  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  // Format timer as M:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) {
      return { score: 0, label: '', color: '#ddd', width: '0%' };
    }

    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: '#ef4444', width: '33%' };
    }
    if (score <= 4) {
      return { score: 2, label: 'Medium', color: '#f59e0b', width: '66%' };
    }
    return { score: 3, label: 'Strong', color: '#0aad0a', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  // Step 1: Handle Send Reset Code
  const handleSendResetCode = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      const errMsg = 'Please enter a valid email address';
      setError(errMsg);
      showError(errMsg);
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(trimmedEmail);
      success('Reset code sent to your email');
      setOtpTimer(120);
      setOtp(['', '', '', '', '', '']);
      setStep(2);
    } catch (err) {
      const errMsg = err.message || 'Failed to send reset code';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Input Change
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setError('');

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle OTP Key Down (Backspace, Arrow keys)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle Paste for OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setError('');

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Step 2: Handle Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email.trim());
      success('Reset code resent successfully');
      setOtpTimer(120);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const errMsg = err.message || 'Failed to resend reset code';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      const errMsg = 'Please enter the complete 6-digit code';
      setError(errMsg);
      showError(errMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyResetOtp(email.trim(), otpCode);
      if (!res?.resetToken) {
        throw new Error('The server did not return a valid password reset token.');
      }
      setResetToken(res.resetToken);
      success('OTP verified successfully');
      setStep(3);
    } catch (err) {
      const errMsg = err.message || 'Invalid or expired OTP code';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      const errMsg = 'Password must be at least 6 characters';
      setError(errMsg);
      showError(errMsg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const errMsg = 'Passwords do not match';
      setError(errMsg);
      showError(errMsg);
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      success('Password reset successfully! Please login with your new password.');
      if (onBackToLogin) {
        onBackToLogin();
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to reset password';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="overlay modal-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="modal-box" style={{ width: '380px', maxWidth: '92vw' }}>
        <span className="close-icon" onClick={onClose} style={{ cursor: 'pointer' }}>
          &times;
        </span>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'var(--text-heading)' }}>
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
            {step === 1 && 'Enter your email to receive a reset code'}
            {step === 2 && (
              <>
                Enter the 6-digit code sent to <br />
                <strong style={{ color: 'var(--text-heading)' }}>{email}</strong>
              </>
            )}
            {step === 3 && 'Create a new password for your account'}
          </p>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: step === s ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: step === s ? 'var(--color-primary)' : step > s ? '#86efac' : 'var(--border-glass)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Error Box */}
        {error && (
          <div
            style={{
              background: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '13px',
              textAlign: 'center',
              lineHeight: 1.4,
              fontWeight: '600'
            }}
          >
            {error}
          </div>
        )}

        {/* STEP 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendResetCode}>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="green-btn"
              disabled={loading}
              style={{
                width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending Reset Code...' : 'Send Reset Code'}
            </button>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '20px', textAlign: 'center' }}>
              Remember your password?{' '}
              <span
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  if (onBackToLogin) onBackToLogin();
                  else if (onClose) onClose();
                }}
              >
                Back to Login
              </span>
            </p>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '6px',
                marginBottom: '15px',
              }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  disabled={loading}
                  style={{
                    width: '45px',
                    height: '48px',
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: '700',
                    border: digit ? '2px solid var(--color-primary)' : '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    outline: 'none',
                    background: digit ? 'var(--color-primary-light)' : 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </div>

            {/* Timer and Resend Code */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                Expires in:{' '}
                <strong style={{ color: otpTimer > 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                  {formatTimer(otpTimer)}
                </strong>
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpTimer > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: otpTimer > 0 ? 'var(--text-muted)' : 'var(--color-primary)',
                  fontWeight: 'bold',
                  cursor: otpTimer > 0 || loading ? 'not-allowed' : 'pointer',
                  textDecoration: otpTimer === 0 ? 'underline' : 'none',
                  padding: 0,
                  fontSize: '13px',
                }}
              >
                Resend Code
              </button>
            </div>

            <button
              type="submit"
              className="green-btn"
              disabled={loading}
              style={{
                width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '20px',
                fontSize: '12.5px',
              }}
            >
              <span
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
              >
                Change Email
              </span>

              <span
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  if (onBackToLogin) onBackToLogin();
                  else if (onClose) onClose();
                }}
              >
                Back to Login
              </span>
            </div>
          </form>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            {/* New Password Input */}
            <div style={{ marginBottom: '12px', position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  padding: '4px 6px',
                  fontWeight: '600',
                }}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Password Strength:</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: strength.color,
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    background: 'var(--border-glass)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: strength.width,
                      height: '100%',
                      background: strength.color,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password Input */}
            <div style={{ marginBottom: '15px', position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  padding: '4px 6px',
                  fontWeight: '600',
                }}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              className="green-btn"
              disabled={loading}
              style={{
                width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '20px', textAlign: 'center' }}>
              <span
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  if (onBackToLogin) onBackToLogin();
                  else if (onClose) onClose();
                }}
              >
                Back to Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
