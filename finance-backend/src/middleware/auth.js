const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { getDb } = require('../config/database');

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches req.user = { id, email, role } on success.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required. Please provide a valid Bearer token.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getDb();

    // Verify user still exists and is active
    const user = await db.get('SELECT id, email, role, is_active FROM users WHERE id = ?', decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User account not found.'));
    }

    if (!user.is_active) {
      return next(new ApiError(401, 'User account is deactivated.'));
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token has expired. Please refresh your token.'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid access token.'));
    }
    next(err);
  }
};

module.exports = { authenticate };
