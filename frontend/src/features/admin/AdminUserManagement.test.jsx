import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminUserManagement from './AdminUserManagement';
import { userManagementAPI } from '../../services';

const mockAddToast = jest.fn();

jest.mock('../../services', () => ({
  userManagementAPI: {
    getUsers: jest.fn(),
    getAuthStats: jest.fn(),
    getLoginLogs: jest.fn(),
    getActivityLogs: jest.fn(),
  },
}));

jest.mock('../../context', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe('AdminUserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userManagementAPI.getUsers.mockResolvedValue({
      users: [{
        id: 'user-1',
        username: 'mira',
        email: 'mira@example.com',
        role: 'customer',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
      }],
      pagination: { total: 1 },
    });
    userManagementAPI.getAuthStats.mockResolvedValue({
      stats: {
        totalUsers: 1,
        activeUsers: 1,
        inactiveUsers: 0,
        newUsersLast7Days: 1,
      },
    });
    userManagementAPI.getLoginLogs.mockResolvedValue({
      loginLogs: [{
        id: 'login-1',
        email: 'mira@example.com',
        action: 'login_success',
        ipAddress: '203.0.113.10',
        userAgent: 'Test browser',
        createdAt: '2025-01-02T00:00:00.000Z',
        user: { username: 'mira' },
      }],
      pagination: { total: 1 },
    });
    userManagementAPI.getActivityLogs.mockResolvedValue({
      activityLogs: [{
        id: 'activity-1',
        action: 'role_change',
        details: JSON.stringify({ adminUsername: 'store-admin', newRole: 'staff' }),
        ipAddress: '203.0.113.11',
        createdAt: '2025-01-03T00:00:00.000Z',
      }],
      pagination: { total: 1 },
    });
  });

  test('renders server-backed users, access logs, and activity logs', async () => {
    render(<AdminUserManagement />);

    expect(await screen.findByText('mira@example.com')).toBeInTheDocument();
    expect(userManagementAPI.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 6 })
    );

    fireEvent.click(screen.getByRole('button', { name: /Access & Audit Logs/i }));
    expect(await screen.findByText('203.0.113.10')).toBeInTheDocument();
    expect(screen.getByText('Test browser')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Activity Logs/i }));
    expect(await screen.findByText('store-admin')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.11')).toBeInTheDocument();
    await waitFor(() => {
      expect(userManagementAPI.getActivityLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 6 })
      );
    });
  });
});
