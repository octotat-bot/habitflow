import axios from 'axios';
import { tabStorage } from './storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token from tab-isolated sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = tabStorage.get('hf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally (only clears THIS tab's token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tabStorage.remove('hf_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
