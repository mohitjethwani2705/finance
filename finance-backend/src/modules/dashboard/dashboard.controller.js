const dashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  res.status(200).json(new ApiResponse(200, 'Dashboard summary retrieved.', data));
});

const getTrends = asyncHandler(async (req, res) => {
  const period = ['monthly', 'weekly'].includes(req.query.period) ? req.query.period : 'monthly';
  const data = await dashboardService.getTrends(period);
  res.status(200).json(new ApiResponse(200, `${period} trends retrieved.`, data));
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategoryBreakdown();
  res.status(200).json(new ApiResponse(200, 'Category breakdown retrieved.', data));
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentActivity(req.query.limit || 5);
  res.status(200).json(new ApiResponse(200, 'Recent activity retrieved.', data));
});

const getTopCategories = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopCategories(req.query.limit || 5);
  res.status(200).json(new ApiResponse(200, 'Top categories retrieved.', data));
});

module.exports = { getSummary, getTrends, getCategoryBreakdown, getRecentActivity, getTopCategories };
