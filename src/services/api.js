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

  getMe: () => 
    apiRequest('/auth/me'),

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
