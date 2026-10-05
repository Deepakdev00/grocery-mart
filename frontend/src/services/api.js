const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

export const adminApiRequest = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Auth API
export const authAPI = {
  signup: (username, email, password) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: { username, email, password }
    }),

  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  getMe: () => apiRequest('/auth/me'),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    }),

  verifyResetOtp: (email, otp) =>
    apiRequest('/auth/verify-reset-otp', {
      method: 'POST',
      body: { email, otp }
    }),

  resetPassword: (token, newPassword) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword }
    }),

  refreshToken: () =>
    apiRequest('/auth/refresh-token', {
      method: 'POST'
    }),

  getSessions: () => apiRequest('/auth/sessions'),

  revokeSession: (sessionId) =>
    apiRequest(`/auth/sessions/${sessionId}`, {
      method: 'DELETE'
    }),

  revokeAllSessions: () =>
    apiRequest('/auth/sessions', {
      method: 'DELETE'
    }),

  updateProfile: (data) =>
    apiRequest('/auth/update', {
      method: 'PUT',
      body: data
    }),
};

export const adminAPI = {
  login: (email, password) =>
    adminApiRequest('/admin/login', {
      method: 'POST',
      body: { email, password }
    }),
  getMe: () => adminApiRequest('/admin/me'),
  logout: () => adminApiRequest('/admin/logout', { method: 'POST' })
};

export const productsAPI = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
  },
  createProduct: (product) =>
    adminApiRequest('/products', { method: 'POST', body: product }),
  updateProduct: (id, product) =>
    adminApiRequest(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: product }),
  deleteProduct: (id) =>
    adminApiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
};

export const wishlistAPI = {
  getWishlist: () => apiRequest('/wishlist'),
  add: (productId) =>
    apiRequest('/wishlist', { method: 'POST', body: { productId } }),
  remove: (productId) =>
    apiRequest(`/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE' })
};

export const profileAPI = {
  get: () => apiRequest('/profile'),
  update: (data) => apiRequest('/profile', { method: 'PUT', body: data }),
  updateTheme: (theme) => apiRequest('/profile/theme', { method: 'PUT', body: { theme } }),
  changePassword: (data) => apiRequest('/profile/change-password', { method: 'POST', body: data }),
  deleteAccount: (password) => apiRequest('/profile/account', {
    method: 'DELETE',
    body: { password }
  })
};

export const supportAPI = {
  getTickets: () => apiRequest('/support/tickets'),
  createTicket: (data) => apiRequest('/support/tickets', { method: 'POST', body: data }),
  getTicket: (id) => apiRequest(`/support/tickets/${encodeURIComponent(id)}`),
  reply: (id, message) => apiRequest(`/support/tickets/${encodeURIComponent(id)}/reply`, {
    method: 'POST',
    body: { message }
  })
};

// User Management API (admin)
export const userManagementAPI = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString();
    return adminApiRequest(`/admin/user-management/users${queryString ? `?${queryString}` : ''}`);
  },

  createUser: (data) =>
    adminApiRequest('/admin/user-management/users', {
      method: 'POST',
      body: data
    }),

  getUserDetails: (userId) =>
    adminApiRequest(`/admin/user-management/users/${userId}`),

  updateUserStatus: (userId, status) =>
    adminApiRequest(`/admin/user-management/users/${userId}/status`, {
      method: 'PUT',
      body: { status }
    }),

  updateUserRole: (userId, role) =>
    adminApiRequest(`/admin/user-management/users/${userId}/role`, {
      method: 'PUT',
      body: { role }
    }),

  getUserSessions: (userId) =>
    adminApiRequest(`/admin/user-management/users/${userId}/sessions`),

  forceLogoutUser: (userId) =>
    adminApiRequest(`/admin/user-management/users/${userId}/sessions`, {
      method: 'DELETE'
    }),

  getLoginLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value);
    });
    const queryString = query.toString();
    return adminApiRequest(`/admin/user-management/login-logs${queryString ? `?${queryString}` : ''}`);
  },

  getActivityLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value);
    });
    const queryString = query.toString();
    return adminApiRequest(`/admin/user-management/activity-logs${queryString ? `?${queryString}` : ''}`);
  },

  getAuthStats: () =>
    adminApiRequest('/admin/user-management/dashboard/stats'),
};

// Cart API
export const cartAPI = {
  getCart: () =>
    apiRequest('/cart'),

  addToCart: (product) =>
    apiRequest('/cart/add', {
      method: 'POST',
      body: {
        productId: product.id,
        qty: product.qty || 1
      }
    }),

  updateCart: (productId, qty) =>
    apiRequest('/cart/update', {
      method: 'PUT',
      body: { productId: String(productId), qty }
    }),

  removeFromCart: (productId) =>
    apiRequest(`/cart/remove/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    }),

  clearCart: () =>
    apiRequest('/cart/clear', {
      method: 'DELETE'
    }),

  syncCart: (items) =>
    apiRequest('/cart/sync', {
      method: 'POST',
      body: { items }
    }),
};

// Payment API
export const paymentAPI = {
  processPayment: (paymentData) =>
    apiRequest('/payment/process', {
      method: 'POST',
      body: paymentData
    }),

  getHistory: () =>
    apiRequest('/payment/history'),

  getOrder: (orderId) =>
    apiRequest(`/payment/${orderId}`),
};

// Health check
export const checkHealth = () =>
  apiRequest('/health');

const api = {
  auth: authAPI,
  admin: adminAPI,
  products: productsAPI,
  wishlist: wishlistAPI,
  profile: profileAPI,
  support: supportAPI,
  cart: cartAPI,
  payment: paymentAPI,
  userManagement: userManagementAPI,
  checkHealth,
};

export default api;
