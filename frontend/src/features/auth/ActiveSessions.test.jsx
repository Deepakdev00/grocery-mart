import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ActiveSessions from './ActiveSessions';
import { authAPI } from '../../services';
import * as ToastContextModule from '../../context/ToastContext';

jest.mock('../../services', () => ({
  authAPI: {
    getSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
  },
}));

jest.mock('../../context/ToastContext', () => ({
  useToast: jest.fn(),
}));

describe('ActiveSessions Component', () => {
  const mockSuccess = jest.fn();
  const mockError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'current-test-token');
    ToastContextModule.useToast.mockReturnValue({
      success: mockSuccess,
      error: mockError,
      addToast: jest.fn(),
    });
  });

  test('fetches and displays active sessions with current badge and revoke actions', async () => {
    authAPI.getSessions.mockResolvedValueOnce({
      sessions: [
        {
          id: 's1',
          token: 'current-test-token',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
          loginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isCurrent: true,
        },
        {
          id: 's2',
          token: 'other-mobile-token',
          ipAddress: '10.0.0.5',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
          loginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isCurrent: false,
        },
      ],
    });

    render(<ActiveSessions />);

    expect(screen.getByText(/Loading active sessions/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Current Session/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/192.168.1.100/i)).toBeInTheDocument();
    expect(screen.getByText(/10.0.0.5/i)).toBeInTheDocument();
    expect(screen.getByText(/Revoke All Other Sessions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Revoke$/i })).toBeInTheDocument();
  });

  test('revokes a single session when confirmed', async () => {
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    authAPI.getSessions.mockResolvedValueOnce({
      sessions: [
        {
          id: 's1',
          token: 'current-test-token',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0',
          isCurrent: true,
        },
        {
          id: 's2',
          token: 'other-token',
          ipAddress: '10.0.0.5',
          userAgent: 'Mozilla/5.0 (iPhone) Mobile/15E148',
          isCurrent: false,
        },
      ],
    });
    authAPI.revokeSession.mockResolvedValueOnce({ success: true });

    render(<ActiveSessions />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Revoke$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/i }));

    await waitFor(() => {
      expect(authAPI.revokeSession).toHaveBeenCalledWith('s2');
      expect(mockSuccess).toHaveBeenCalledWith('Session revoked successfully');
    });
  });
});
