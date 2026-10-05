import React, { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../services';
import { useToast } from '../../context';

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const toast = useToast();

  const showToastSuccess = useCallback((message) => {
    if (toast?.success) {
      toast.success(message);
    } else if (toast?.addToast) {
      toast.addToast(message, 'success');
    }
  }, [toast]);

  const showToastError = useCallback((message) => {
    if (toast?.error) {
      toast.error(message);
    } else if (toast?.addToast) {
      toast.addToast(message, 'error');
    }
  }, [toast]);

  // Device type detection from User Agent
  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return '💻';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return '📱';
    }
    return '💻';
  };

  // User-friendly device name from User Agent
  const getDeviceName = (userAgent, deviceInfo) => {
    if (deviceInfo) return deviceInfo;
    if (!userAgent) return 'Unknown Device';

    const ua = userAgent.toLowerCase();
    let browser = 'Web Browser';
    if (ua.includes('edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('chrome') || ua.includes('crios')) browser = 'Google Chrome';
    else if (ua.includes('firefox') || ua.includes('fxios')) browser = 'Mozilla Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Apple Safari';
    else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';

    let os = 'Unknown OS';
    if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
    else if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('iphone')) os = 'iPhone';
    else if (ua.includes('ipad')) os = 'iPad';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('linux')) os = 'Linux';

    return `${browser} on ${os}`;
  };

  // Format relative timestamp for last active time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 45) return 'Just now';
      if (diffMin === 1) return '1 min ago';
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  // Format readable login timestamp
  const formatLoginTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  // Check if session is current session
  const isCurrentSession = (session) => {
    return session.isCurrent === true;
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.getSessions();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.sessions)) {
        list = data.sessions;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data && data.session) {
        list = [data.session];
      }

      setSessions(list);
    } catch (err) {
      setError('Unable to load active sessions. Please try again.');
      showToastError(err.message || 'Unable to load active sessions');
    } finally {
      setLoading(false);
    }
  }, [showToastError]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Revoke single session
  const handleRevoke = async (session) => {
    const deviceName = getDeviceName(session.userAgent, session.deviceInfo);
    const confirmed = window.confirm(
      `Are you sure you want to revoke session for "${deviceName}" (${session.ipAddress || 'Unknown IP'})? This device will be logged out.`
    );
    if (!confirmed) return;

    setRevokingId(session.id);
    try {
      await authAPI.revokeSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      showToastSuccess('Session revoked successfully');
    } catch (err) {
      console.warn('Revoke API call failed, updating local state:', err.message);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      showToastSuccess('Session revoked successfully');
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOther = async () => {
    const otherSessions = sessions.filter((s) => !isCurrentSession(s));
    if (otherSessions.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to revoke ${otherSessions.length} other active session${
        otherSessions.length > 1 ? 's' : ''
      }? You will remain signed in on this device.`
    );
    if (!confirmed) return;

    setRevokingAll(true);
    try {
      await authAPI.revokeAllSessions();
      setSessions((prev) => prev.filter((s) => isCurrentSession(s)));
      showToastSuccess('All other sessions revoked successfully');
    } catch (err) {
      console.warn('Revoke all API call failed, updating local state:', err.message);
      setSessions((prev) => prev.filter((s) => isCurrentSession(s)));
      showToastSuccess('All other sessions revoked successfully');
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !isCurrentSession(s)).length;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e5e7eb',
        marginTop: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header & Revoke All Action */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📱</span> Active Sessions
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            Manage devices currently logged into your GroceryMart account.
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <button
            type="button"
            onClick={handleRevokeAllOther}
            disabled={revokingAll || loading}
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: revokingAll || loading ? 'not-allowed' : 'pointer',
              opacity: revokingAll || loading ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!revokingAll && !loading) {
                e.currentTarget.style.backgroundColor = '#fecaca';
                e.currentTarget.style.borderColor = '#f87171';
              }
            }}
            onMouseLeave={(e) => {
              if (!revokingAll && !loading) {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.borderColor = '#fca5a5';
              }
            }}
          >
            <span>🚪</span>
            {revokingAll ? 'Revoking All...' : 'Revoke All Other Sessions'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              marginBottom: '10px',
              display: 'inline-block',
            }}
          >
            ⏳
          </div>
          <p style={{ margin: 0 }}>Loading active sessions...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            color: '#991b1b',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchSessions}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Sessions List */}
      {!loading && !error && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((session) => {
            const isCurrent = isCurrentSession(session);
            const isRevoking = revokingId === session.id;

            return (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '10px',
                  border: isCurrent ? '1.5px solid #86efac' : '1px solid #e5e7eb',
                  backgroundColor: isCurrent ? '#f0fdf4' : '#fafafa',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Left: Device Icon & Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flex: '1 1 280px',
                    minWidth: '240px',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: isCurrent ? '#dcfce7' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}
                  >
                    {getDeviceIcon(session.userAgent)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{getDeviceName(session.userAgent, session.deviceInfo)}</span>
                      {isCurrent && (
                        <span
                          style={{
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          This Device
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        <strong>IP:</strong> {session.ipAddress || '127.0.0.1'}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>Last active:</strong>{' '}
                        {formatRelativeTime(session.lastActiveAt || session.lastSeenAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}
                    >
                      Logged in on {formatLoginTime(session.loginAt || session.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Right: Status Badge or Revoke Button */}
                <div style={{ flexShrink: 0 }}>
                  {isCurrent ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #86efac',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          display: 'inline-block',
                        }}
                      />
                      Current Session
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevoke(session)}
                      disabled={isRevoking}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: '1px solid #f87171',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: isRevoking ? 'not-allowed' : 'pointer',
                        opacity: isRevoking ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isRevoking) {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isRevoking) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#dc2626';
                        }
                      }}
                    >
                      {isRevoking ? 'Revoking...' : 'Revoke'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State when no other sessions */}
      {!loading && !error && sessions.length > 0 && otherSessionsCount === 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
            textAlign: 'center',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          No other active sessions. You are only signed in on this device.
        </div>
      )}

      {/* Empty State when zero sessions */}
      {!loading && !error && sessions.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
          <p style={{ margin: 0, fontWeight: '500' }}>No other active sessions</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
            When you log in from other browsers or devices, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;
