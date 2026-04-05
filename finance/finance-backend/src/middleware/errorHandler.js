const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // express-validator ValidationError (from validationResult)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  // Operational errors (thrown as ApiError intentionally)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      ...(err.errors.length > 0 && { errors: err.errors }),
    });
  }

  // SQLite unique constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: 'A record with this value already exists.',
    });
  }

  // SQLite foreign key constraint
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || (err.message && err.message.includes('FOREIGN KEY constraint failed'))) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Referenced resource does not exist.',
    });
  }

  // Unknown / unexpected errors — hide internals in production
  const isDev = process.env.NODE_ENV === 'development';
  console.error('[ERROR]', err);

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'An unexpected error occurred.',
    ...(isDev && { error: err.message, stack: err.stack }),
  });
};

module.exports = errorHandler;
