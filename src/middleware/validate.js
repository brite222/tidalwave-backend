const ApiError = require('../utils/apiError');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ApiError(422, 'Validation failed', result.error.flatten()));
  }
  req[source] = result.data;
  next();
};