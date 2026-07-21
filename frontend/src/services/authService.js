import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload),
  resendOtp: (payload) => api.post('/auth/resend-otp', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  updatePreferences: (payload) => api.patch('/auth/preferences', payload),
};
