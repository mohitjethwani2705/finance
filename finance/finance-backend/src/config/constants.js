/**
 * Application-wide constants.
 * Centralizing these avoids magic strings scattered across the codebase.
 */

// User roles. New accounts default to VIEWER (least privilege).
const ROLES = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
};

// Financial record types
const RECORD_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

// Pagination defaults and limits
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,   // prevents client from requesting unbounded data
};

// Sorting options for record listing
const SORT = {
  DEFAULT_BY: 'date',
  DEFAULT_ORDER: 'desc',
  // Allowlist prevents SQL injection via sort field interpolation
  ALLOWED_BY: ['date', 'amount', 'category', 'title', 'created_at'],
  ALLOWED_ORDER: ['asc', 'desc'],
};

module.exports = { ROLES, RECORD_TYPES, PAGINATION, SORT };
