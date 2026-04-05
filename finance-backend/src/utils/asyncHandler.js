/**
 * asyncHandler — wraps async route handlers so any thrown error is
 * forwarded to Express's next() instead of crashing the process.
 *
 * Without this wrapper every async controller would need its own try/catch.
 * With it, we write: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
