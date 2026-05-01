const AppError = require('../utils/AppError');

/**
 * Validates req.body fields.
 * Usage: validate(['email', 'password'])
 */
const validate = (fields) => (req, res, next) => {
  const missing = fields.filter(f => !req.body[f]?.toString().trim());
  if (missing.length)
    return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
  next();
};

module.exports = validate;
