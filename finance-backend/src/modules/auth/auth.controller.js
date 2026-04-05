const authService = require('./auth.service');
const { getDb } = require('../../config/database');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register(name, email, password);
  res.status(201).json(new ApiResponse(201, 'Account created successfully.', user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json(new ApiResponse(200, 'Login successful.', result));
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refresh(refreshToken);
  res.status(200).json(new ApiResponse(200, 'Token refreshed successfully.', tokens));
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.status(200).json(new ApiResponse(200, 'Logged out successfully.'));
});

const me = asyncHandler(async (req, res) => {
  const db = await getDb();
  const user = await db.get(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    req.user.id
  );
  res.status(200).json(new ApiResponse(200, 'Profile retrieved.', user));
});

module.exports = { register, login, refresh, logout, me };
