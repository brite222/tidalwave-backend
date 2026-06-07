const ApiError = require('../utils/apiError');

module.exports = (err, req, res, next) => {
  console.error(err);
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false, message: err.message, data: null, errors: err.errors,
    });
  }
  return res.status(500).json({
    success: false, message: 'Internal server error', data: null, errors: null,
  });
};