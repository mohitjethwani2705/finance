const usersService = require('./users.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { PAGINATION } = require('../../config/constants');

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT)
  );

  const { users, total, totalPages } = await usersService.listUsers(page, limit);
  res.status(200).json(
    new ApiResponse(200, 'Users retrieved successfully.', users, { total, page, limit, totalPages })
  );
});

const getUserById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  if (req.user.role !== 'admin' && req.user.id !== id) {
    throw new ApiError(403, 'Access denied. You can only view your own profile.');
  }

  const user = await usersService.getUserById(id);
  res.status(200).json(new ApiResponse(200, 'User retrieved successfully.', user));
});

const updateUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, role, is_active } = req.body;
  const user = await usersService.updateUser(id, { name, role, is_active });
  res.status(200).json(new ApiResponse(200, 'User updated successfully.', user));
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  await usersService.deleteUser(id, req.user.id);
  res.status(200).json(new ApiResponse(200, 'User deleted successfully.'));
});

module.exports = { listUsers, getUserById, updateUser, deleteUser };
