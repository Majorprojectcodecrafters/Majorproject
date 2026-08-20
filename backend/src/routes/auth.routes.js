const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.get('/me',        protect, authController.getMe);

module.exports = router;