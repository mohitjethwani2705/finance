const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');

// All dashboard routes require authentication; all roles can view
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', controller.getSummary);

// GET /api/dashboard/trends?period=monthly|weekly
router.get('/trends', controller.getTrends);

// GET /api/dashboard/categories
router.get('/categories', controller.getCategoryBreakdown);

// GET /api/dashboard/recent?limit=5
router.get('/recent', controller.getRecentActivity);

// GET /api/dashboard/top-categories?limit=5
router.get('/top-categories', controller.getTopCategories);

module.exports = router;
