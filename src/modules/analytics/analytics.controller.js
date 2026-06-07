const svc = require('./analytics.service');
const { success } = require('../../utils/apiResponse');

exports.zoneVolume = async (req, res, next) => {
  try { success(res, { data: await svc.zoneVolume(req.query) }); }
  catch (e) { next(e); }
};
exports.recyclingRate = async (req, res, next) => {
  try { success(res, { data: await svc.recyclingRate() }); }
  catch (e) { next(e); }
};
exports.contractorPerformance = async (req, res, next) => {
  try { success(res, { data: await svc.contractorPerformance() }); }
  catch (e) { next(e); }
};
exports.costSavings = async (req, res, next) => {
  try { success(res, { data: await svc.costSavings() }); }
  catch (e) { next(e); }
};