const svc = require('./bins.service');
const { success } = require('../../utils/apiResponse');

exports.create = async (req, res, next) => {
  try { success(res, { status: 201, message: 'Bin created', data: await svc.createBin(req.body) }); }
  catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { items, total } = await svc.listBins({ ...req.query, page, limit });
    success(res, { message: 'Bins fetched', data: items, meta: { page, limit, total } });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try { success(res, { data: await svc.getBin(req.params.id) }); }
  catch (e) { next(e); }
};

exports.telemetry = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const data = await svc.ingestTelemetry(req.body, io);
    success(res, { message: 'Telemetry recorded', data });
  } catch (e) { next(e); }
};