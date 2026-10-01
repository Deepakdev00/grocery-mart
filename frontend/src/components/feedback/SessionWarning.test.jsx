import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionWarning from './SessionWarning';
import * as AuthContextModule from '../../context/AuthContext';

// Mock useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('SessionWarning Component', () => {
  const mockDismissSessionWarning = jest.fn();
  const mockRefreshSession = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when showSessionWarning is false', () => {
    AuthContextModule.useAuth.mockReturnValue({
      showSessionWarning: false,
      dismissSessionWarning: mockDismissSessionWarning,
      refreshSession: mockRefreshSession,
      logout: mockLogout,
    });

    const { container } = render(<SessionWarning />);
    expect(container.firstChild).toBeNull();
  });

  test('renders warning popup and handles stay signed in and logout clicks', () => {
    AuthContextModule.useAuth.mockReturnValue({
      showSessionWarning: true,
      dismissSessionWarning: mockDismissSessionWarning,
      refreshSession: mockRefreshSession,
      logout: mockLogout,
    });

    render(<SessionWarning />);

    expect(screen.getByText(/Session Expiring Soon/i)).toBeInTheDocument();
    expect(screen.getByText(/Your session will expire in/i)).toBeInTheDocument();
    expect(screen.getByText(/due to inactivity/i)).toBeInTheDocument();
    expect(screen.getByText(/2:00/i)).toBeInTheDocument();

    const staySignedInBtn = screen.getByRole('button', { name: /Stay Signed In/i });
    const logoutBtn = screen.getByRole('button', { name: /Logout/i });

    expect(staySignedInBtn).toBeInTheDocument();
    expect(logoutBtn).toBeInTheDocument();

    // Click Stay Signed In
    fireEvent.click(staySignedInBtn);
    expect(mockDismissSessionWarning).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);

    // Click Logout
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
