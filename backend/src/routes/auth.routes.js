const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.get('/me',        protect, authController.getMe);
router.get('/classes',   authController.getPublicClasses);
router.get('/streams',   authController.getPublicStreams);

// Google Drive OAuth 2.0 Flow Routes
router.get('/google/url',      authController.getGoogleAuthUrl);
router.get('/google/callback', authController.googleOAuthCallback);

module.exports = router;