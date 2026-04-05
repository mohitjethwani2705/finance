const ApiError = require('../utils/ApiError');

/**
 * Role-based access control (RBAC) middleware factory.
 *
 * Usage in routes:
 *   router.post('/', authenticate, authorize('analyst', 'admin'), controller.create)
 *
 * Role hierarchy (least to most privileged):
 *   viewer  — read-only access to records and dashboard
 *   analyst — can also create and update records
 *   admin   — full access including user management and record deletion
 *
 * Authorization is checked AFTER authentication (req.user must be set).
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}. Your current role is: ${req.user.role}.`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
