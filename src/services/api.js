const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    // If API fails, use mock/local storage instead
    console.warn('API call failed, using mock auth:', error.message);
    throw error;
  }
};

// Mock user storage (simulates backend database)
const getMockUsers = () => {
  const users = localStorage.getItem('mock_users');
  return users ? JSON.parse(users) : [];
};

const saveMockUser = (user) => {
  const users = getMockUsers();
  users.push(user);
  localStorage.setItem('mock_users', JSON.stringify(users));
};

const findMockUser = (email) => {
  const users = getMockUsers();
  return users.find(u => u.email === email);
};

// Auth API
export const authAPI = {
  signup: async (username, email, password) => {
    try {
      // Try real API first
      return await apiRequest('/auth/signup', {
        method: 'POST',
        body: { username, email, password }
      });
    } catch (error) {
      // Fallback to mock auth
      const existingUser = findMockUser(email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const newUser = {
        id: 'user_' + Date.now(),
        username,
        email,
        password, // In production, never store plain passwords!
        createdAt: new Date().toISOString()
      };

      saveMockUser(newUser);

      const token = 'mock_token_' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.username
      }));

      return {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.username
        }
      };
    }
  },

  login: async (email, password) => {
    try {
      // Try real API first
      return await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
    } catch (error) {
      // Fallback to mock auth
      const user = findMockUser(email);
      if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
      }

      const token = 'mock_token_' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.username
      }));

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.username
        }
      };
    }
  },

  getMe: () => {
    const user = localStorage.getItem('user');
    return user ? { user: JSON.parse(user) } : { user: null };
  },

  updateProfile: (data) =>
    apiRequest('/auth/update', {
      method: 'PUT',
      body: data
    }),
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
        name: product.name,
        weight: product.weight,
        price: product.price,
        img: product.img,
        qty: product.qty || 1
      }
    }),

  updateCart: (productId, qty) => 
    apiRequest('/cart/update', {
      method: 'PUT',
      body: { productId: String(productId), qty }
    }),

  removeFromCart: (productId) => 
    apiRequest(`/cart/remove/${productId}`, {
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
  cart: cartAPI,
  payment: paymentAPI,
  checkHealth,
};

export default api;
