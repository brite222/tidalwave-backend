const svc = require('./alerts.service');
const { success } = require('../../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const data = await svc.list({ ...req.query, page, limit });
    success(res, { message: 'Alerts fetched', data, meta: { page, limit, total: data.length } });
  } catch (e) { next(e); }
};

exports.resolve = async (req, res, next) => {
  try { success(res, { message: 'Alert resolved', data: await svc.resolve(req.params.id) }); }
  catch (e) { next(e); }
};