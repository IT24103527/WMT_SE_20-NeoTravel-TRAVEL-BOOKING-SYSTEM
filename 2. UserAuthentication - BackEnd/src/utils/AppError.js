/**
 * Custom operational error class.
 * Thrown from controllers/middleware to produce clean HTTP error responses.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
