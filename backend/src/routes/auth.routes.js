const express = require('express');
const router = express.Router();
const { login, register, me, changePassword } = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public
router.post('/login', login);

// Admin-only: create new user accounts (teacher/parent/admin)
router.post('/register', authenticate, authorize('admin'), register);

// Authenticated
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
