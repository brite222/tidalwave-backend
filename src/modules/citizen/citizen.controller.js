const svc = require('./citizen.service');
const { success } = require('../../utils/apiResponse');

exports.nearest = async (req, res, next) => {
  try {
    const data = await svc.nearestBin({
      lat: parseFloat(req.query.lat),
      lng: parseFloat(req.query.lng),
      radius_m: parseInt(req.query.radius_m || '2000', 10),
    });
    success(res, { data });
  } catch (e) { next(e); }
};

exports.dispose = async (req, res, next) => {
  try {
    const data = await svc.logDisposal({ user_id: req.user.id, ...req.body });
    success(res, { status: 201, message: 'Disposal logged', data });
  } catch (e) { next(e); }
};

exports.report = async (req, res, next) => {
  try {
    const data = await svc.reportIllegalDumping({ user_id: req.user.id, ...req.body });
    success(res, { status: 201, message: 'Report submitted', data });
  } catch (e) { next(e); }
};

exports.balance = async (req, res, next) => {
  try { success(res, { data: await svc.getBalance(req.user.id) }); }
  catch (e) { next(e); }
};

exports.history = async (req, res, next) => {
  try { success(res, { data: await svc.history(req.user.id) }); }
  catch (e) { next(e); }
};

exports.claim = async (req, res, next) => {
  try {
    const data = await svc.claimReward({ user_id: req.user.id, reward_id: req.body.reward_id });
    success(res, { status: 201, message: 'Reward claimed', data });
  } catch (e) { next(e); }
};