import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const rawAuthUrl = (import.meta.env.VITE_AUTH_API_URL || '').replace(/\/+$/, '');
const rawProjectUrl = (import.meta.env.VITE_PROJECT_API_URL || '').replace(/\/+$/, '');

// Request Interceptor — routes dynamically across microservice domains if
// VITE_AUTH_API_URL / VITE_PROJECT_API_URL are set, or uses /api for Vite dev proxy / rewrites.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncmind_token');

    const useRemoteUrls = !import.meta.env.DEV || import.meta.env.VITE_USE_REMOTE_API === 'true';

    if (useRemoteUrls) {
      if (config.url && config.url.startsWith('/auth') && rawAuthUrl) {
        config.baseURL = rawAuthUrl;
        config.url = config.url.replace(/^\/auth/, '');
      } else if (rawProjectUrl && !config.url?.startsWith('/auth')) {
        config.baseURL = rawProjectUrl;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
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