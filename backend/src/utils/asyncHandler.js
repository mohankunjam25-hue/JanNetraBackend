/**
 * Utility wrapper for async Express route handlers.
 * Catches errors from async functions and passes them to the Express error handler.
 *
 * @param {Function} requestHandler - The async controller function to wrap.
 * @returns {Function} An Express-compatible route handler.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = { asyncHandler };
