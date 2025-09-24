import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // Login user
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register new user
  signup: async (userData: {
    phasionName: string;
    email: string;
    password: string;
    passwordConfirmed: string;
    role?: string;
    solanaWallet?: string;
  }) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: any) => {
    const response = await api.patch('/users/me', userData);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
};

// Clothes API endpoints
export const clothesAPI = {
  // Get all clothes
  getAll: async (params?: any) => {
    const response = await api.get('/clothes', { params });
    return response.data;
  },

  // Get single cloth
  getById: async (id: string) => {
    const response = await api.get(`/clothes/${id}`);
    return response.data;
  },

  // Create new cloth (for designers)
  create: async (clothData: any) => {
    const response = await api.post('/clothes', clothData);
    return response.data;
  },
};

// Escrow API endpoints
export const escrowAPI = {
  // Create vault payment
  createVaultPayment: async (paymentData: {
    clothId: string;
    amount: number;
    customerWallet: string;
    designerWallet: string;
  }) => {
    const response = await api.post('/escrow/create', paymentData);
    return response.data;
  },

  // Get escrow status
  getStatus: async (escrowId: string) => {
    const response = await api.get(`/escrow/${escrowId}/status`);
    return response.data;
  },

  // Lock payment
  lockPayment: async (escrowId: string) => {
    const response = await api.post(`/escrow/${escrowId}/lock`);
    return response.data;
  },

  // Get vault status
  getVaultStatus: async () => {
    const response = await api.get('/escrow/vault/status');
    return response.data;
  },
};

export default api;
