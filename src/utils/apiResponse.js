exports.success = (res, { message = 'OK', data = null, meta = null, status = 200 }) =>
  res.status(status).json({ success: true, message, data, ...(meta && { meta }) });

exports.error = (res, { message = 'Error', errors = null, status = 400 }) =>
  res.status(status).json({ success: false, message, data: null, errors });