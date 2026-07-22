const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updatePreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otpCode: z.string().length(6, 'OTP must be exactly 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

module.exports = { registerSchema, loginSchema, updatePreferencesSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema };
