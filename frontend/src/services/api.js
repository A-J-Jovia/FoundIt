import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Item APIs
export const itemAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  delete: (id) => api.delete(`/items/${id}`),
  submitClaim: (id, data) => api.post(`/items/${id}/claim`, data),
  startVerification: (id, data) => api.put(`/items/${id}/verify`, data),
  decideClaim: (id, data) => api.put(`/items/${id}/decide`, data),
  getReturnToken: (id) => api.get(`/items/${id}/return-token`),
  scanReturnItem: (id, data) => api.put(`/items/${id}/scan-return`, data),
};

// AI APIs
export const aiAPI = {
  getInsights: (data) => api.post('/ai/insights', data),
  chat: (data) => api.post('/ai/chat', data),
};

// Stats APIs
export const statsAPI = {
  getPublic: () => api.get('/stats/public'),
};

export default api;
