const express      = require('express');
const {
  signup, login, refreshToken, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
} = require('../controllers/auth.controller');
const protectRoute = require('../middleware/auth.middleware');
const validate     = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/signup',              validate(['username', 'email', 'password']), signup);
router.post('/login',               authLimiter, validate(['email', 'password']), login);
router.post('/refresh',             validate(['refreshToken']), refreshToken);
router.post('/logout',              protectRoute, logout);
router.post('/verify-email',        validate(['email', 'otp']), verifyEmail);
router.post('/resend-verification', validate(['email']), resendVerification);
router.post('/forgot-password',     authLimiter, validate(['email']), forgotPassword);
router.post('/reset-password',      validate(['email', 'otp', 'newPassword']), resetPassword);

module.exports = router;
