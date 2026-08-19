import axios from 'axios';

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ezfinanz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response.data;
}, (error) => {
  const customError = error.response?.data?.error || {
    code: 'NETWORK_ERROR',
    message: error.message || 'Server connection failed.'
  };
  return Promise.reject(customError);
});

export default api;
