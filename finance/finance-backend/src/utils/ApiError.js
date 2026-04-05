/**
 * ApiError — custom operational error class.
 *
 * Distinguishes between expected errors (wrong input, not found, unauthorized)
 * and unexpected crashes. The global error handler checks `isOperational`
 * to decide whether to expose the message to the client.
 *
 * Usage:
 *   throw new ApiError(404, 'Record not found.');
 *   throw new ApiError(422, 'Validation failed', [{ field: 'email', message: '...' }]);
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;  // distinguishes from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
