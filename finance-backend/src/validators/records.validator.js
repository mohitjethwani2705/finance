const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ApiError(422, 'Validation failed', formatted));
  }
  next();
};

const createRecordRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['income', 'expense']).withMessage('Type must be "income" or "expense"'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 100 }).withMessage('Category must be at most 100 characters'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
];

const updateRecordRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be "income" or "expense"'),
  body('category')
    .optional()
    .trim()
    .notEmpty().withMessage('Category cannot be empty')
    .isLength({ max: 100 }).withMessage('Category must be at most 100 characters'),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
];

module.exports = { validate, createRecordRules, updateRecordRules };
