import React, { useState, useEffect, useCallback } from 'react';
import { userManagementAPI } from '../../services';
import { useToast } from '../../context';

// Default mock datasets for fallback/offline mode
const INITIAL_MOCK_USERS = [
  {
    id: 'user_1',
    username: 'alex_mart',
    name: 'Alex Johnson',
    email: 'alex.johnson@grocerymart.com',
    role: 'customer',
    status: 'active',
    phone: '+91 98765 43210',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 15 * 60000).toISOString(),
    avatarBg: '#3b82f6',
  },
  {
    id: 'user_2',
    username: 'sarah_ops',
    name: 'Sarah Connor',
    email: 'sarah.c@grocerymart.com',
    role: 'staff',
    status: 'active',
    phone: '+91 98765 12345',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 2 * 3600000).toISOString(),
    avatarBg: '#8b5cf6',
  },
  {
    id: 'user_3',
    username: 'freshfarms_sup',
    name: 'Fresh Farms Supply Co.',
    email: 'contact@freshfarms.in',
    role: 'supplier',
    status: 'active',
    phone: '+91 98111 22334',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 24 * 3600000).toISOString(),
    avatarBg: '#f97316',
  },
  {
    id: 'user_4',
    username: 'greenvalley_ret',
    name: 'Green Valley Retailers',
    email: 'orders@greenvalley.com',
    role: 'retailer',
    status: 'inactive',
    phone: '+91 97222 33445',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 72 * 3600000).toISOString(),
    avatarBg: '#14b8a6',
  },
  {
    id: 'user_5',
    username: 'david_miller',
    name: 'David Miller',
    email: 'david.m@gmail.com',
    role: 'customer',
    status: 'suspended',
    phone: '+91 96333 44556',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 120 * 86400000).toISOString(),
    avatarBg: '#ef4444',
  },
  {
    id: 'user_6',
    username: 'priya_sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@grocerymart.com',
    role: 'staff',
    status: 'active',
    phone: '+91 95444 55667',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 5 * 60000).toISOString(),
    avatarBg: '#8b5cf6',
  },
  {
    id: 'user_7',
    username: 'organic_harvest',
    name: 'Organic Harvest Ltd.',
    email: 'supply@organicharvest.com',
    role: 'supplier',
    status: 'active',
    phone: '+91 94555 66778',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 6 * 3600000).toISOString(),
    avatarBg: '#f97316',
  }
];

const INITIAL_MOCK_LOGIN_LOGS = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    email: 'alex.johnson@grocerymart.com',
    user: 'Alex Johnson',
    action: 'LOGIN_SUCCESS',
    ip: '192.168.1.45',
    userAgent: 'Chrome 122.0 / Windows 11',
    device: 'Desktop',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    email: 'unknown.hacker@evil.org',
    user: 'unknown.hacker@evil.org',
    action: 'LOGIN_FAILED',
    ip: '45.134.22.9',
    userAgent: 'Python-Requests / Linux',
    device: 'Bot/Script',
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    email: 'sarah.c@grocerymart.com',
    user: 'Sarah Connor',
    action: 'LOGOUT',
    ip: '192.168.1.12',
    userAgent: 'Safari 17.2 / macOS Sonoma',
    device: 'Desktop',
  },
  {
    id: 'log_4',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    email: 'david.m@gmail.com',
    user: 'David Miller',
    action: 'ACCOUNT_LOCKED',
    ip: '182.74.12.8',
    userAgent: 'Chrome Mobile 120.0 / Android 14',
    device: 'Mobile',
  },
  {
    id: 'log_5',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    email: 'contact@freshfarms.in',
    user: 'Fresh Farms Supply Co.',
    action: 'PASSWORD_RESET',
    ip: '103.21.124.5',
    userAgent: 'Firefox 123.0 / Windows 10',
    device: 'Desktop',
  },
  {
    id: 'log_6',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    email: 'priya.sharma@grocerymart.com',
    user: 'Priya Sharma',
    action: 'LOGIN_SUCCESS',
    ip: '192.168.1.88',
    userAgent: 'Chrome 122.0 / Windows 11',
    device: 'Desktop',
  },
  {
    id: 'log_7',
    timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
    email: 'orders@greenvalley.com',
    user: 'Green Valley Retailers',
    action: 'LOGIN_FAILED',
    ip: '115.99.201.44',
    userAgent: 'Edge 122.0 / Windows 10',
    device: 'Desktop',
  }
];

const INITIAL_MOCK_ACTIVITY_LOGS = [
  {
    id: 'act_1',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    action: 'ROLE_UPDATED',
    performedBy: 'admin@grocerymart.com',
    details: { targetUser: 'sarah.c@grocerymart.com', oldRole: 'customer', newRole: 'staff', reason: 'Promotion to store manager' },
    ip: '192.168.1.1',
  },
  {
    id: 'act_2',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    action: 'STATUS_CHANGED',
    performedBy: 'admin@grocerymart.com',
    details: { targetUser: 'david.m@gmail.com', oldStatus: 'active', newStatus: 'suspended', reason: 'Repeated failed login attempts / security lock' },
    ip: '192.168.1.1',
  },
  {
    id: 'act_3',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    action: 'USER_CREATED',
    performedBy: 'admin@grocerymart.com',
    details: { targetUser: 'priya.sharma@grocerymart.com', role: 'staff', channel: 'Admin Dashboard Onboarding' },
    ip: '192.168.1.1',
  },
  {
    id: 'act_4',
    timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
    action: 'FORCE_LOGOUT',
    performedBy: 'admin@grocerymart.com',
    details: { targetUser: 'orders@greenvalley.com', revokedSessionsCount: 2, reason: 'Security session purge' },
    ip: '192.168.1.1',
  },
  {
    id: 'act_5',
    timestamp: new Date(Date.now() - 30 * 3600000).toISOString(),
    action: 'STATUS_CHANGED',
    performedBy: 'admin@grocerymart.com',
    details: { targetUser: 'orders@greenvalley.com', oldStatus: 'active', newStatus: 'inactive', reason: 'Inactivity past 30 days' },
    ip: '192.168.1.1',
  },
  {
    id: 'act_6',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    action: 'ROLE_UPDATED',
    performedBy: 'admin@grocerymart.com',
    details: { targetUser: 'contact@freshfarms.in', oldRole: 'retailer', newRole: 'supplier', reason: 'Account type alignment' },
    ip: '192.168.1.1',
  }
];

export const AdminUserManagement = () => {
  // Safe Toast hook consumption
  let toastContext = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toastContext = useToast();
  } catch (err) {
    // Fallback if rendered outside ToastProvider
  }

  const showToast = useCallback((message, type = 'success') => {
    if (toastContext && toastContext[type]) {
      toastContext[type](message);
    } else if (toastContext && toastContext.addToast) {
      toastContext.addToast(message, type);
    } else {
      console.log(`[Toast ${type}]:`, message);
    }
  }, [toastContext]);

  // Tab State
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'create' | 'access_logs' | 'activity_logs'

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Tab 1: User Directory State
  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 7,
    activeUsers: 5,
    inactiveUsers: 1,
    newThisWeek: 2,
  });

  // Tab 2: Create User Form State
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [creatingUser, setCreatingUser] = useState(false);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionsModalUser, setSessionsModalUser] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Tab 3: Access Logs State
  const [accessLogs, setAccessLogs] = useState(INITIAL_MOCK_LOGIN_LOGS);
  const [accessActionFilter, setAccessActionFilter] = useState('all');
  const [accessSearchQuery, setAccessSearchQuery] = useState('');
  const [accessStartDate, setAccessStartDate] = useState('');
  const [accessEndDate, setAccessEndDate] = useState('');
  const [accessPage, setAccessPage] = useState(1);
  const logsPerPage = 6;

  // Tab 4: Activity Logs State
  const [activityLogs, setActivityLogs] = useState(INITIAL_MOCK_ACTIVITY_LOGS);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityPage, setActivityPage] = useState(1);

  // Helper to calculate stats locally
  const computeStats = useCallback((userList) => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const total = userList.length;
    const active = userList.filter(u => u.status === 'active').length;
    const inactive = userList.filter(u => u.status === 'inactive' || u.status === 'suspended').length;
    const newWeek = userList.filter(u => {
      const createdTime = new Date(u.createdAt).getTime();
      return createdTime >= oneWeekAgo;
    }).length;

    return {
      totalUsers: total,
      activeUsers: active,
      inactiveUsers: inactive,
      newThisWeek: newWeek,
    };
  }, []);

  // Fetch Dashboard Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      if (userManagementAPI?.getAuthStats) {
        const res = await userManagementAPI.getAuthStats();
        if (res && res.stats) {
          setStats(res.stats);
          setStatsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API getAuthStats failed, calculating from local state:', err.message);
    }
    // Fallback calculation
    setStats(prev => ({ ...prev, ...computeStats(users) }));
    setStatsLoading(false);
  }, [computeStats, users]);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (userManagementAPI?.getUsers) {
        const res = await userManagementAPI.getUsers({
          search: searchQuery || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        if (res && res.users && Array.isArray(res.users)) {
          setUsers(res.users);
          if (res.stats) setStats(res.stats);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API getUsers failed, using local user store:', err.message);
    }
    setLoading(false);
  }, [searchQuery, roleFilter, statusFilter]);

  // Fetch Access Logs
  const loadAccessLogs = useCallback(async () => {
    try {
      if (userManagementAPI?.getLoginLogs) {
        const res = await userManagementAPI.getLoginLogs({
          search: accessSearchQuery || undefined,
          action: accessActionFilter !== 'all' ? accessActionFilter : undefined,
          startDate: accessStartDate || undefined,
          endDate: accessEndDate || undefined,
        });
        if (res && res.logs && Array.isArray(res.logs)) {
          setAccessLogs(res.logs);
        }
      }
    } catch (err) {
      console.warn('API getLoginLogs failed, using mock data:', err.message);
    }
  }, [accessSearchQuery, accessActionFilter, accessStartDate, accessEndDate]);

  // Fetch Activity Logs
  const loadActivityLogs = useCallback(async () => {
    try {
      if (userManagementAPI?.getActivityLogs) {
        const res = await userManagementAPI.getActivityLogs({
          search: activitySearchQuery || undefined,
          action: activityActionFilter !== 'all' ? activityActionFilter : undefined,
        });
        if (res && res.logs && Array.isArray(res.logs)) {
          setActivityLogs(res.logs);
        }
      }
    } catch (err) {
      console.warn('API getActivityLogs failed, using mock data:', err.message);
    }
  }, [activitySearchQuery, activityActionFilter]);

  // Initial load
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  useEffect(() => {
    if (activeTab === 'access_logs') {
      loadAccessLogs();
    } else if (activeTab === 'activity_logs') {
      loadActivityLogs();
    }
  }, [activeTab, loadAccessLogs, loadActivityLogs]);

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!createForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (createForm.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!createForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!createForm.password) {
      errors.password = 'Password is required';
    } else if (createForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!createForm.role) {
      errors.role = 'Role is required';
    }

    if (createForm.phone && !/^[0-9+\-\s()]{7,15}$/.test(createForm.phone.trim())) {
      errors.phone = 'Enter a valid phone number (optional)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create User Submit
  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setCreatingUser(true);
    const newUserData = {
      username: createForm.username.trim(),
      email: createForm.email.trim().toLowerCase(),
      password: createForm.password,
      role: createForm.role,
      phone: createForm.phone.trim() || undefined,
    };

    try {
      let created = null;
      if (userManagementAPI?.createUser) {
        const res = await userManagementAPI.createUser(newUserData);
        if (res && res.user) {
          created = res.user;
        }
      }

      if (!created) {
        // Fallback local creation
        const roleColors = {
          customer: '#3b82f6',
          staff: '#8b5cf6',
          supplier: '#f97316',
          retailer: '#14b8a6',
        };
        created = {
          id: 'user_' + Date.now(),
          username: newUserData.username,
          name: newUserData.username,
          email: newUserData.email,
          role: newUserData.role,
          status: 'active',
          phone: newUserData.phone || '+91 99000 00000',
          createdAt: new Date().toISOString(),
          lastActive: 'Just now',
          avatarBg: roleColors[newUserData.role] || '#3b82f6',
        };
      }

      setUsers(prev => [created, ...prev]);

      // Record Activity Log
      const newActLog = {
        id: 'act_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'USER_CREATED',
        performedBy: 'admin@grocerymart.com',
        details: { targetUser: created.email, role: created.role, username: created.username },
        ip: '192.168.1.1',
      };
      setActivityLogs(prev => [newActLog, ...prev]);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        activeUsers: prev.activeUsers + 1,
        newThisWeek: prev.newThisWeek + 1,
      }));

      showToast(`User ${created.username} created successfully!`, 'success');
      setCreateForm({
        username: '',
        email: '',
        password: '',
        role: 'customer',
        phone: '',
      });
      setFormErrors({});
      setShowCreateModal(false);
      setActiveTab('directory');
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const oldRole = targetUser.role;

    try {
      if (userManagementAPI?.updateUserRole) {
        await userManagementAPI.updateUserRole(userId, newRole);
      }
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );

      // Record activity log
      const newActLog = {
        id: 'act_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'ROLE_UPDATED',
        performedBy: 'admin@grocerymart.com',
        details: { targetUser: targetUser.email, oldRole, newRole },
        ip: '192.168.1.1',
      };
      setActivityLogs(prev => [newActLog, ...prev]);

      showToast(`Role for ${targetUser.username} updated to ${newRole.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  // Handle Status Change
  const handleStatusChange = async (userId, newStatus) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const oldStatus = targetUser.status;

    try {
      if (userManagementAPI?.updateUserStatus) {
        await userManagementAPI.updateUserStatus(userId, newStatus);
      }
      const updatedList = users.map(u => (u.id === userId ? { ...u, status: newStatus } : u));
      setUsers(updatedList);
      setStats(computeStats(updatedList));

      // Record activity log
      const newActLog = {
        id: 'act_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'STATUS_CHANGED',
        performedBy: 'admin@grocerymart.com',
        details: { targetUser: targetUser.email, oldStatus, newStatus },
        ip: '192.168.1.1',
      };
      setActivityLogs(prev => [newActLog, ...prev]);

      showToast(`Status for ${targetUser.username} updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  // Handle Force Logout
  const handleForceLogout = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (!window.confirm(`Are you sure you want to force logout all active sessions for ${targetUser.username}?`)) {
      return;
    }

    try {
      if (userManagementAPI?.forceLogoutUser) {
        await userManagementAPI.forceLogoutUser(userId);
      }

      // Record activity log
      const newActLog = {
        id: 'act_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'FORCE_LOGOUT',
        performedBy: 'admin@grocerymart.com',
        details: { targetUser: targetUser.email, action: 'Terminated all active tokens/sessions' },
        ip: '192.168.1.1',
      };
      setActivityLogs(prev => [newActLog, ...prev]);

      showToast(`Active sessions for ${targetUser.username} have been terminated`, 'success');
      if (sessionsModalUser?.id === userId) {
        setUserSessions([]);
      }
    } catch (err) {
      showToast(err.message || 'Failed to force logout user', 'error');
    }
  };

  // Open Sessions Modal
  const openSessionsModal = async (user) => {
    setSessionsModalUser(user);
    setLoadingSessions(true);
    try {
      let sessions = [];
      if (userManagementAPI?.getUserSessions) {
        const res = await userManagementAPI.getUserSessions(user.id);
        if (res && res.sessions && Array.isArray(res.sessions)) {
          sessions = res.sessions;
        }
      }

      if (sessions.length === 0) {
        // Mock fallback sessions
        sessions = [
          {
            id: 'sess_' + user.id + '_1',
            device: 'Chrome 122 / Windows 11',
            ip: '192.168.1.45',
            loginTime: new Date(Date.now() - 3 * 3600000).toISOString(),
            lastActive: new Date(Date.now() - 10 * 60000).toISOString(),
            status: 'active',
            isCurrent: true,
          },
          {
            id: 'sess_' + user.id + '_2',
            device: 'Safari / iPhone 15 Pro',
            ip: '172.56.21.90',
            loginTime: new Date(Date.now() - 2 * 86400000).toISOString(),
            lastActive: new Date(Date.now() - 28 * 3600000).toISOString(),
            status: 'active',
            isCurrent: false,
          }
        ];
      }
      setUserSessions(sessions);
    } catch (err) {
      console.warn('Failed to load user sessions:', err.message);
      setUserSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Filtering for Directory
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || (user.role || '').toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || (user.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Filtering for Access Logs
  const filteredAccessLogs = accessLogs.filter(log => {
    const matchesSearch =
      (log.email || '').toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
      (log.user || '').toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
      (log.ip || '').includes(accessSearchQuery);

    const matchesAction =
      accessActionFilter === 'all' ||
      log.action.toLowerCase() === accessActionFilter.toLowerCase();

    let matchesDate = true;
    if (accessStartDate) {
      matchesDate = matchesDate && new Date(log.timestamp) >= new Date(accessStartDate);
    }
    if (accessEndDate) {
      const end = new Date(accessEndDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(log.timestamp) <= end;
    }

    return matchesSearch && matchesAction && matchesDate;
  });

  const totalAccessPages = Math.ceil(filteredAccessLogs.length / logsPerPage) || 1;
  const paginatedAccessLogs = filteredAccessLogs.slice(
    (accessPage - 1) * logsPerPage,
    accessPage * logsPerPage
  );

  // Filtering for Activity Logs
  const filteredActivityLogs = activityLogs.filter(log => {
    const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details);
    const matchesSearch =
      (log.performedBy || '').toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      detailsStr.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      (log.ip || '').includes(activitySearchQuery);

    const matchesAction =
      activityActionFilter === 'all' ||
      log.action.toLowerCase() === activityActionFilter.toLowerCase();

    return matchesSearch && matchesAction;
  });

  const totalActivityPages = Math.ceil(filteredActivityLogs.length / logsPerPage) || 1;
  const paginatedActivityLogs = filteredActivityLogs.slice(
    (activityPage - 1) * logsPerPage,
    activityPage * logsPerPage
  );

  // Format Date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Color mappings for roles
  const getRoleBadgeStyle = (role) => {
    const norm = (role || '').toLowerCase();
    switch (norm) {
      case 'staff':
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
      case 'supplier':
        return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
      case 'retailer':
        return { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' };
      case 'customer':
      default:
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    }
  };

  // Color mappings for statuses
  const getStatusBadgeStyle = (status) => {
    const norm = (status || '').toLowerCase();
    switch (norm) {
      case 'active':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#22c55e' };
      case 'suspended':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444' };
      case 'inactive':
      default:
        return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', dot: '#6b7280' };
    }
  };

  // Color mappings for access log actions
  const getActionBadgeStyle = (action) => {
    const norm = (action || '').toUpperCase();
    if (norm.includes('SUCCESS') || norm === 'LOGIN') {
      return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Login Success' };
    }
    if (norm.includes('FAILED') || norm.includes('LOCKED') || norm.includes('SUSPEND')) {
      return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: norm.replace('_', ' ') };
    }
    if (norm.includes('LOGOUT')) {
      return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Logout' };
    }
    if (norm.includes('RESET') || norm.includes('PASSWORD')) {
      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Password Reset' };
    }
    return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: action };
  };

  // Inline styles object
  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1280px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'var(--text-primary, #1c1c1c)',
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    headerTitle: {
      fontSize: '26px',
      fontWeight: '800',
      margin: 0,
      color: 'var(--text-heading, #0f172a)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    headerSubtitle: {
      fontSize: '14px',
      color: 'var(--text-muted, #64748b)',
      marginTop: '4px',
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    primaryBtn: {
      backgroundColor: 'var(--color-primary, #0c831f)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 18px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(12, 131, 31, 0.2)',
    },
    secondaryBtn: {
      backgroundColor: 'var(--bg-secondary, #ffffff)',
      color: 'var(--text-primary, #1c1c1c)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderRadius: '12px',
      padding: '18px 20px',
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    statIconWrapper: (bg, color) => ({
      width: '48px',
      height: '48px',
      borderRadius: '10px',
      backgroundColor: bg,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      flexShrink: 0,
    }),
    statValue: {
      fontSize: '24px',
      fontWeight: '800',
      color: 'var(--text-heading, #0f172a)',
      margin: 0,
    },
    statLabel: {
      fontSize: '13px',
      fontWeight: '500',
      color: 'var(--text-muted, #64748b)',
      margin: '2px 0 0 0',
    },
    tabNav: {
      display: 'flex',
      borderBottom: '1px solid var(--border-color, #e2e8f0)',
      marginBottom: '24px',
      gap: '8px',
      overflowX: 'auto',
    },
    tabButton: (isActive) => ({
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: isActive ? '700' : '500',
      color: isActive ? 'var(--color-primary, #0c831f)' : 'var(--text-secondary, #64748b)',
      border: 'none',
      borderBottom: isActive ? '3px solid var(--color-primary, #0c831f)' : '3px solid transparent',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease',
    }),
    filterBar: {
      backgroundColor: 'var(--bg-card, #ffffff)',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      marginBottom: '20px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    searchInput: {
      flex: '1 1 240px',
      padding: '10px 14px',
      fontSize: '14px',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-input, #f8f8f8)',
      color: 'var(--text-primary, #1c1c1c)',
      outline: 'none',
    },
    selectInput: {
      padding: '10px 14px',
      fontSize: '14px',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-input, #f8f8f8)',
      color: 'var(--text-primary, #1c1c1c)',
      outline: 'none',
      cursor: 'pointer',
    },
    tableWrapper: {
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
      overflow: 'hidden',
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: '14px',
    },
    th: {
      backgroundColor: 'var(--bg-input, #f8fafc)',
      padding: '14px 16px',
      fontWeight: '600',
      color: 'var(--text-secondary, #475569)',
      borderBottom: '1px solid var(--border-color, #e2e8f0)',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-light, #f1f5f9)',
      verticalAlign: 'middle',
      color: 'var(--text-primary, #1c1c1c)',
    },
    avatarCircle: (bg) => ({
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      backgroundColor: bg || '#3b82f6',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '14px',
      flexShrink: 0,
      textTransform: 'uppercase',
    }),
    userCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userName: {
      fontWeight: '600',
      fontSize: '14px',
      color: 'var(--text-heading, #0f172a)',
      marginBottom: '2px',
    },
    userEmail: {
      fontSize: '12px',
      color: 'var(--text-muted, #64748b)',
    },
    badge: (style) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }),
    dot: (color) => ({
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      backgroundColor: color,
    }),
    actionBtnGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexWrap: 'wrap',
    },
    actionBtn: {
      padding: '6px 10px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '6px',
      border: '1px solid var(--border-color, #e2e8f0)',
      backgroundColor: 'var(--bg-secondary, #ffffff)',
      color: 'var(--text-primary, #1c1c1c)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    actionBtnDanger: {
      padding: '6px 10px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '6px',
      border: '1px solid #fecaca',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderTop: '1px solid var(--border-color, #e2e8f0)',
      flexWrap: 'wrap',
      gap: '12px',
    },
    pageBtn: (isActive, disabled) => ({
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: isActive ? '700' : '500',
      borderRadius: '6px',
      border: '1px solid var(--border-color, #e2e8f0)',
      backgroundColor: isActive ? 'var(--color-primary, #0c831f)' : 'var(--bg-secondary, #ffffff)',
      color: isActive ? '#ffffff' : disabled ? 'var(--text-muted, #94a3b8)' : 'var(--text-primary, #1c1c1c)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s ease',
    }),
    formCard: {
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderRadius: '12px',
      padding: '28px',
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
      maxWidth: '680px',
      margin: '0 auto',
    },
    formGroup: {
      marginBottom: '18px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '6px',
      color: 'var(--text-heading, #0f172a)',
    },
    input: (hasError) => ({
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      borderRadius: '8px',
      border: `1px solid ${hasError ? '#ef4444' : 'var(--border-color, #e2e8f0)'}`,
      backgroundColor: 'var(--bg-input, #f8f8f8)',
      color: 'var(--text-primary, #1c1c1c)',
      outline: 'none',
      boxSizing: 'border-box',
    }),
    errorText: {
      color: '#ef4444',
      fontSize: '12px',
      marginTop: '4px',
      fontWeight: '500',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
      backdropFilter: 'blur(2px)',
    },
    modalContent: {
      backgroundColor: 'var(--bg-modal, #ffffff)',
      borderRadius: '14px',
      width: '100%',
      maxWidth: '560px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border-color, #e2e8f0)',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: '18px 24px',
      borderBottom: '1px solid var(--border-color, #e2e8f0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalBody: {
      padding: '24px',
      overflowY: 'auto',
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: '1px solid var(--border-color, #e2e8f0)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      backgroundColor: 'var(--bg-input, #f8fafc)',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '22px',
      cursor: 'pointer',
      color: 'var(--text-muted, #64748b)',
      padding: '0 4px',
      lineHeight: '1',
    },
    jsonBlock: {
      backgroundColor: 'var(--bg-input, #f1f5f9)',
      padding: '8px 12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: 'var(--text-secondary, #334155)',
      maxHeight: '120px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      margin: 0,
    }
  };

  // -------------------------------------------------------------
  // RENDER TAB 1: User Directory
  // -------------------------------------------------------------
  const renderUserDirectory = () => (
    <div>
      {/* Stats Bar */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconWrapper('#eff6ff', '#2563eb')}>
            <span>👥</span>
          </div>
          <div>
            <p style={styles.statValue}>{statsLoading ? '...' : stats.totalUsers}</p>
            <p style={styles.statLabel}>Total Users</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconWrapper('#f0fdf4', '#16a34a')}>
            <span>🟢</span>
          </div>
          <div>
            <p style={styles.statValue}>{statsLoading ? '...' : stats.activeUsers}</p>
            <p style={styles.statLabel}>Active Users</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconWrapper('#fef2f2', '#ef4444')}>
            <span>⛔</span>
          </div>
          <div>
            <p style={styles.statValue}>{statsLoading ? '...' : stats.inactiveUsers}</p>
            <p style={styles.statLabel}>Inactive / Suspended</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconWrapper('#f5f3ff', '#7c3aed')}>
            <span>✨</span>
          </div>
          <div>
            <p style={styles.statValue}>{statsLoading ? '...' : stats.newThisWeek}</p>
            <p style={styles.statLabel}>New (This Week)</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.searchInput}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.selectInput}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="supplier">Supplier</option>
            <option value="retailer">Retailer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.selectInput}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            style={styles.primaryBtn}
            title="Register a new user account"
          >
            <span>+</span> Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Registered Date</th>
              <th style={styles.th}>Last Active</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ ...styles.td, textAlign: 'center', padding: '36px' }}>
                  Loading user records...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ ...styles.td, textAlign: 'center', padding: '36px', color: 'var(--text-muted, #64748b)' }}>
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const roleStyle = getRoleBadgeStyle(user.role);
                const statusStyle = getStatusBadgeStyle(user.status);
                const initial = (user.name || user.username || 'U').charAt(0);

                return (
                  <tr key={user.id} style={{ transition: 'background-color 0.15s' }}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.avatarCircle(user.avatarBg || roleStyle.color)}>
                          {initial}
                        </div>
                        <div>
                          <div style={styles.userName}>{user.name || user.username}</div>
                          <div style={styles.userEmail}>{user.email}</div>
                          {user.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(roleStyle)}>
                        {user.role || 'customer'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(statusStyle)}>
                        <span style={styles.dot(statusStyle.dot)}></span>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                        {formatDate(user.lastActive) || 'Recent'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtnGroup}>
                        {/* Change Role Dropdown */}
                        <select
                          value={user.role || 'customer'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{
                            ...styles.actionBtn,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                          title="Change user role (RBAC)"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="supplier">Supplier</option>
                          <option value="retailer">Retailer</option>
                        </select>

                        {/* Toggle Status Select */}
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          style={{
                            ...styles.actionBtn,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                          title="Change account status"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>

                        {/* View Sessions */}
                        <button
                          onClick={() => openSessionsModal(user)}
                          style={styles.actionBtn}
                          title="View user active sessions"
                        >
                          Sessions
                        </button>

                        {/* Force Logout */}
                        <button
                          onClick={() => handleForceLogout(user.id)}
                          style={styles.actionBtnDanger}
                          title="Terminate all user sessions"
                        >
                          Force Logout
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={styles.pagination}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            Showing {filteredUsers.length > 0 ? (currentPage - 1) * usersPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={styles.pageBtn(false, currentPage === 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={styles.pageBtn(currentPage === page, false)}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalUserPages))}
              disabled={currentPage === totalUserPages || totalUserPages === 0}
              style={styles.pageBtn(false, currentPage === totalUserPages || totalUserPages === 0)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER TAB 2: Create User Form
  // -------------------------------------------------------------
  const renderCreateUserForm = () => (
    <div style={styles.formCard}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: 'var(--text-heading, #0f172a)' }}>
          User Registration & Onboarding
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted, #64748b)' }}>
          Create new staff, supplier, retailer, or customer accounts with designated permissions.
        </p>
      </div>

      <form onSubmit={handleCreateUser}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Username <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. john_doe"
            value={createForm.username}
            onChange={(e) => {
              setCreateForm({ ...createForm, username: e.target.value });
              if (formErrors.username) setFormErrors({ ...formErrors, username: null });
            }}
            style={styles.input(!!formErrors.username)}
          />
          {formErrors.username && <div style={styles.errorText}>{formErrors.username}</div>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Email Address <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="email"
            placeholder="e.g. user@grocerymart.com"
            value={createForm.email}
            onChange={(e) => {
              setCreateForm({ ...createForm, email: e.target.value });
              if (formErrors.email) setFormErrors({ ...formErrors, email: null });
            }}
            style={styles.input(!!formErrors.email)}
          />
          {formErrors.email && <div style={styles.errorText}>{formErrors.email}</div>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={createForm.password}
            onChange={(e) => {
              setCreateForm({ ...createForm, password: e.target.value });
              if (formErrors.password) setFormErrors({ ...formErrors, password: null });
            }}
            style={styles.input(!!formErrors.password)}
          />
          {formErrors.password && <div style={styles.errorText}>{formErrors.password}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Role (Access Level) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              style={{ ...styles.input(!!formErrors.role), cursor: 'pointer' }}
            >
              <option value="customer">Customer (Standard User)</option>
              <option value="staff">Staff (Store / Operations)</option>
              <option value="supplier">Supplier (Inventory & Supply)</option>
              <option value="retailer">Retailer (B2B Bulk Merchant)</option>
            </select>
            {formErrors.role && <div style={styles.errorText}>{formErrors.role}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number (Optional)</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={createForm.phone}
              onChange={(e) => {
                setCreateForm({ ...createForm, phone: e.target.value });
                if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
              }}
              style={styles.input(!!formErrors.phone)}
            />
            {formErrors.phone && <div style={styles.errorText}>{formErrors.phone}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => {
              setCreateForm({
                username: '',
                email: '',
                password: '',
                role: 'customer',
                phone: '',
              });
              setFormErrors({});
            }}
            style={styles.secondaryBtn}
            disabled={creatingUser}
          >
            Clear Form
          </button>
          <button
            type="submit"
            style={styles.primaryBtn}
            disabled={creatingUser}
          >
            {creatingUser ? 'Creating User...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER TAB 3: Access & Audit Logs
  // -------------------------------------------------------------
  const renderAccessLogs = () => (
    <div>
      {/* Access Logs Filters */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by user, email, or IP address..."
          value={accessSearchQuery}
          onChange={(e) => {
            setAccessSearchQuery(e.target.value);
            setAccessPage(1);
          }}
          style={styles.searchInput}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={accessActionFilter}
            onChange={(e) => {
              setAccessActionFilter(e.target.value);
              setAccessPage(1);
            }}
            style={styles.selectInput}
          >
            <option value="all">All Action Types</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="LOGOUT">Logout</option>
            <option value="PASSWORD_RESET">Password Reset</option>
            <option value="ACCOUNT_LOCKED">Account Locked</option>
          </select>

          <input
            type="date"
            value={accessStartDate}
            onChange={(e) => {
              setAccessStartDate(e.target.value);
              setAccessPage(1);
            }}
            style={styles.selectInput}
            title="Start Date"
          />

          <input
            type="date"
            value={accessEndDate}
            onChange={(e) => {
              setAccessEndDate(e.target.value);
              setAccessPage(1);
            }}
            style={styles.selectInput}
            title="End Date"
          />

          {(accessSearchQuery || accessActionFilter !== 'all' || accessStartDate || accessEndDate) && (
            <button
              onClick={() => {
                setAccessSearchQuery('');
                setAccessActionFilter('all');
                setAccessStartDate('');
                setAccessEndDate('');
                setAccessPage(1);
              }}
              style={styles.secondaryBtn}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Access Logs Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>User / Email</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>IP Address</th>
              <th style={styles.th}>User Agent / Device</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAccessLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '36px', color: 'var(--text-muted, #64748b)' }}>
                  No access logs found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedAccessLogs.map((log) => {
                const actionBadge = getActionBadgeStyle(log.action);
                return (
                  <tr key={log.id} style={{ transition: 'background-color 0.15s' }}>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary, #475569)' }}>
                        {formatDate(log.timestamp)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-heading, #0f172a)' }}>
                          {log.user || log.email}
                        </div>
                        {log.user && log.email && log.user !== log.email && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{log.email}</div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(actionBadge)}>
                        {actionBadge.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <code style={{ fontSize: '13px', color: 'var(--text-secondary, #334155)' }}>{log.ip || '127.0.0.1'}</code>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                        {log.userAgent || log.device || 'Web Browser'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Access Logs Pagination */}
        <div style={styles.pagination}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            Showing {filteredAccessLogs.length > 0 ? (accessPage - 1) * logsPerPage + 1 : 0} to{' '}
            {Math.min(accessPage * logsPerPage, filteredAccessLogs.length)} of {filteredAccessLogs.length} logs
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setAccessPage(prev => Math.max(prev - 1, 1))}
              disabled={accessPage === 1}
              style={styles.pageBtn(false, accessPage === 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalAccessPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setAccessPage(page)}
                style={styles.pageBtn(accessPage === page, false)}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setAccessPage(prev => Math.min(prev + 1, totalAccessPages))}
              disabled={accessPage === totalAccessPages || totalAccessPages === 0}
              style={styles.pageBtn(false, accessPage === totalAccessPages || totalAccessPages === 0)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER TAB 4: Activity Logs
  // -------------------------------------------------------------
  const renderActivityLogs = () => (
    <div>
      {/* Activity Filters */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by action, performer, or detail..."
          value={activitySearchQuery}
          onChange={(e) => {
            setActivitySearchQuery(e.target.value);
            setActivityPage(1);
          }}
          style={styles.searchInput}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={activityActionFilter}
            onChange={(e) => {
              setActivityActionFilter(e.target.value);
              setActivityPage(1);
            }}
            style={styles.selectInput}
          >
            <option value="all">All Change Types</option>
            <option value="ROLE_UPDATED">Role Updated</option>
            <option value="STATUS_CHANGED">Status Changed</option>
            <option value="USER_CREATED">User Created</option>
            <option value="FORCE_LOGOUT">Force Logout</option>
          </select>

          {(activitySearchQuery || activityActionFilter !== 'all') && (
            <button
              onClick={() => {
                setActivitySearchQuery('');
                setActivityActionFilter('all');
                setActivityPage(1);
              }}
              style={styles.secondaryBtn}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Performed By</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {paginatedActivityLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '36px', color: 'var(--text-muted, #64748b)' }}>
                  No system activity logs found.
                </td>
              </tr>
            ) : (
              paginatedActivityLogs.map((log) => {
                let parsedDetails = log.details;
                if (typeof log.details === 'string') {
                  try {
                    parsedDetails = JSON.parse(log.details);
                  } catch {
                    parsedDetails = log.details;
                  }
                }

                return (
                  <tr key={log.id} style={{ transition: 'background-color 0.15s' }}>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                        {formatDate(log.timestamp)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '12px',
                          color: '#0f172a',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          display: 'inline-block',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '500', fontSize: '13px', color: 'var(--text-heading, #0f172a)' }}>
                        {log.performedBy}
                      </span>
                    </td>
                    <td style={{ ...styles.td, minWidth: '220px' }}>
                      <pre style={styles.jsonBlock}>
                        {typeof parsedDetails === 'object'
                          ? JSON.stringify(parsedDetails, null, 2)
                          : String(parsedDetails)}
                      </pre>
                    </td>
                    <td style={styles.td}>
                      <code style={{ fontSize: '13px', color: 'var(--text-secondary, #334155)' }}>
                        {log.ip || '127.0.0.1'}
                      </code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Activity Logs Pagination */}
        <div style={styles.pagination}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            Showing {filteredActivityLogs.length > 0 ? (activityPage - 1) * logsPerPage + 1 : 0} to{' '}
            {Math.min(activityPage * logsPerPage, filteredActivityLogs.length)} of {filteredActivityLogs.length} logs
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActivityPage(prev => Math.max(prev - 1, 1))}
              disabled={activityPage === 1}
              style={styles.pageBtn(false, activityPage === 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setActivityPage(page)}
                style={styles.pageBtn(activityPage === page, false)}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setActivityPage(prev => Math.min(prev + 1, totalActivityPages))}
              disabled={activityPage === totalActivityPages || totalActivityPages === 0}
              style={styles.pageBtn(false, activityPage === totalActivityPages || totalActivityPages === 0)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.headerTitle}>
            <span>👤</span> User Management & Access Control
          </h1>
          <p style={styles.headerSubtitle}>
            Manage user onboarding, role permissions, active sessions, and security audit logs.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => {
              loadUsers();
              loadStats();
              if (activeTab === 'access_logs') loadAccessLogs();
              if (activeTab === 'activity_logs') loadActivityLogs();
              showToast('Data refreshed', 'info');
            }}
            style={styles.secondaryBtn}
            title="Reload user and audit records"
          >
            <span>🔄</span> Refresh
          </button>

          {activeTab !== 'create' && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={styles.primaryBtn}
            >
              <span>+</span> Add New User
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={styles.tabNav}>
        <button
          onClick={() => setActiveTab('directory')}
          style={styles.tabButton(activeTab === 'directory')}
        >
          <span>👥</span> User Directory
        </button>

        <button
          onClick={() => setActiveTab('create')}
          style={styles.tabButton(activeTab === 'create')}
        >
          <span>➕</span> Create User
        </button>

        <button
          onClick={() => setActiveTab('access_logs')}
          style={styles.tabButton(activeTab === 'access_logs')}
        >
          <span>🔐</span> Access & Audit Logs
        </button>

        <button
          onClick={() => setActiveTab('activity_logs')}
          style={styles.tabButton(activeTab === 'activity_logs')}
        >
          <span>📜</span> Activity Logs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'directory' && renderUserDirectory()}
      {activeTab === 'create' && renderCreateUserForm()}
      {activeTab === 'access_logs' && renderAccessLogs()}
      {activeTab === 'activity_logs' && renderActivityLogs()}

      {/* ========================================================= */}
      {/* MODAL 1: Create User Modal (When clicked from Directory)  */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-heading, #0f172a)' }}>
                Add New User Account
              </h3>
              <button
                style={styles.closeBtn}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. janesmith"
                    value={createForm.username}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, username: e.target.value });
                      if (formErrors.username) setFormErrors({ ...formErrors, username: null });
                    }}
                    style={styles.input(!!formErrors.username)}
                  />
                  {formErrors.username && <div style={styles.errorText}>{formErrors.username}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. jane@grocerymart.com"
                    value={createForm.email}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                    }}
                    style={styles.input(!!formErrors.email)}
                  />
                  {formErrors.email && <div style={styles.errorText}>{formErrors.email}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={createForm.password}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, password: e.target.value });
                      if (formErrors.password) setFormErrors({ ...formErrors, password: null });
                    }}
                    style={styles.input(!!formErrors.password)}
                  />
                  {formErrors.password && <div style={styles.errorText}>{formErrors.password}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    style={{ ...styles.input(false), cursor: 'pointer' }}
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="supplier">Supplier</option>
                    <option value="retailer">Retailer</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    style={styles.input(false)}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryBtn}
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: User Sessions Modal                             */}
      {/* ========================================================= */}
      {sessionsModalUser && (
        <div style={styles.modalOverlay} onClick={() => setSessionsModalUser(null)}>
          <div style={{ ...styles.modalContent, maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-heading, #0f172a)' }}>
                  Active Sessions for {sessionsModalUser.username}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                  {sessionsModalUser.email}
                </p>
              </div>
              <button
                style={styles.closeBtn}
                onClick={() => setSessionsModalUser(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingSessions ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted, #64748b)' }}>
                  Loading session data...
                </div>
              ) : userSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted, #64748b)' }}>
                  No active sessions found for this user.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, #f8fafc)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-heading, #0f172a)' }}>
                            {session.device || 'Desktop Device'}
                          </span>
                          {session.isCurrent && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#16a34a',
                                backgroundColor: '#dcfce7',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #475569)', marginTop: '4px' }}>
                          IP: <code>{session.ip}</code>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          Logged in: {formatDate(session.loginTime)} • Last active: {formatDate(session.lastActive)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleForceLogout(sessionsModalUser.id)}
                        style={styles.actionBtnDanger}
                        title="Revoke session token"
                      >
                        Terminate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => setSessionsModalUser(null)}
              >
                Close
              </button>
              {userSessions.length > 0 && (
                <button
                  type="button"
                  style={styles.actionBtnDanger}
                  onClick={() => handleForceLogout(sessionsModalUser.id)}
                >
                  Terminate All Sessions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
