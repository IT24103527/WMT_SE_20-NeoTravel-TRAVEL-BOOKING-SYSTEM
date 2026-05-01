const AppError = require('../utils/AppError');

/**
 * Global error handler — must have 4 params so Express recognises it.
 * Handles:
 *   - Operational errors (AppError)
 *   - Mongoose validation errors
 *   - Mongoose duplicate key errors
 *   - JWT errors
 *   - Unexpected programming errors
 */
const errorMiddleware = (err, _req, res, _next) => {
  let error = { ...err, message: err.message };

  // ── Mongoose: CastError (invalid ObjectId) ──────────────────────────────
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // ── Mongoose: Duplicate key ──────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`${field} already exists`, 409);
  }

  // ── Mongoose: Validation error ───────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(messages, 422);
  }

  // ── JWT: Invalid token ───────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  // ── JWT: Expired token ───────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  const statusCode = error.statusCode || 500;
  const message    = error.message    || 'Internal Server Error';

  // Don't leak stack traces in production
  const response = {
    success:    false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
