const svc = require('./users.service');
const { success } = require('../../utils/apiResponse');

exports.me = async (req, res, next) => {
  try { success(res, { data: await svc.getById(req.user.id) }); }
  catch (e) { next(e); }
};
