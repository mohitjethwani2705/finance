const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { validate, registerRules, loginRules, refreshRules } = require('../../validators/auth.validator');

// POST /api/auth/register
router.post('/register', registerRules, validate, controller.register);

// POST /api/auth/login
router.post('/login', loginRules, validate, controller.login);

// POST /api/auth/refresh
router.post('/refresh', refreshRules, validate, controller.refresh);

// POST /api/auth/logout
router.post('/logout', controller.logout);

// GET /api/auth/me
router.get('/me', authenticate, controller.me);

module.exports = router;
