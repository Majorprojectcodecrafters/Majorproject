const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');
const rateLimit = require('../middlewares/rateLimit.middleware');

// Strict rate limits for brute-force protection
const authLimiter = rateLimit(10, 15 * 60 * 1000); // 10 attempts per 15 min
const otpLimiter = rateLimit(5, 15 * 60 * 1000);   // 5 OTP attempts per 15 min

router.post('/register',        authLimiter, authController.register);
router.post('/login',           authLimiter, authController.login);
router.post('/logout',          authController.logout);
router.get('/me',               protect, authController.getMe);
router.get('/classes',          authController.getPublicClasses);
router.get('/streams',          authController.getPublicStreams);

// Forgot Password Email OTP Flow Routes (Rate Limited)
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/verify-otp',      otpLimiter, authController.verifyOtp);
router.post('/reset-password',   otpLimiter, authController.resetPassword);

// Google Drive OAuth 2.0 Flow Routes
router.get('/google/url',      authController.getGoogleAuthUrl);
router.get('/google/callback', authController.googleOAuthCallback);

module.exports = router;