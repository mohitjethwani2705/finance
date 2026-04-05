const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validate, updateUserRules } = require('../../validators/users.validator');

// All user routes require authentication
router.use(authenticate);

// GET /api/users - admin only
router.get('/', authorize('admin'), controller.listUsers);

// GET /api/users/:id - admin or self (checked in controller)
router.get('/:id', controller.getUserById);

// PATCH /api/users/:id - admin only
router.patch('/:id', authorize('admin'), updateUserRules, validate, controller.updateUser);

// DELETE /api/users/:id - admin only
router.delete('/:id', authorize('admin'), controller.deleteUser);

module.exports = router;
