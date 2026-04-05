const express = require('express');
const router = express.Router();
const controller = require('./records.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validate, createRecordRules, updateRecordRules } = require('../../validators/records.validator');

// All record routes require authentication
router.use(authenticate);

// GET /api/records - viewer, analyst, admin
router.get('/', controller.listRecords);

// GET /api/records/:id - viewer, analyst, admin
router.get('/:id', controller.getRecordById);

// POST /api/records - analyst, admin only
router.post('/', authorize('analyst', 'admin'), createRecordRules, validate, controller.createRecord);

// PUT /api/records/:id - analyst, admin only
router.put('/:id', authorize('analyst', 'admin'), updateRecordRules, validate, controller.updateRecord);

// DELETE /api/records/:id - admin only
router.delete('/:id', authorize('admin'), controller.deleteRecord);

module.exports = router;
