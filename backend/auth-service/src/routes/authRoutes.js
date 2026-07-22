const router = require('express').Router();
const { register, login, verifyOtp, resendOtp, me, updatePreferences, forgotPassword, resetPassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, verifyOtpSchema, updatePreferencesSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

router.get('/profile', requireAuth, me);
router.get('/me', requireAuth, me);

router.patch('/preferences', requireAuth, validate(updatePreferencesSchema), updatePreferences);

module.exports = router;
