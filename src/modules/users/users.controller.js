const svc = require('./users.service');
const { success } = require('../../utils/apiResponse');

exports.me = async (req, res, next) => {
  try { success(res, { data: await svc.getById(req.user.id) }); }
  catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const data = await svc.updateProfile(req.user.id, req.body);
    success(res, { message: 'Profile updated', data });
  } catch (e) { next(e); }
};
