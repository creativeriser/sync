import axios from 'axios';

// In production, nginx handles routing:
//   /api/auth/* → auth-service:5001
//   /api/*      → project-service:5002
// In dev, Vite proxy handles the same rewrites.
// We always use /api as base — never manipulate URLs at runtime.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — attaches auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncmind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — unwraps data and normalises errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    let message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;

    if (status === 429) {
      message = 'Too many authentication attempts. Please wait a minute and try again.';
    } else if (error.message === 'Network Error' || !error.response) {
      message = 'Network Error: Backend server is not reachable. Ensure the backend services are running.';
    }

    if (status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('syncmind_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status,
      message,
      details: error.response?.data?.details,
    });
  }
);

export default api;