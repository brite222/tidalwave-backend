// routes.controller.js
const svc = require('./routes.service');
const { success } = require('../../utils/apiResponse');

exports.generate = async (req, res, next) => {
  try { success(res, { status: 201, data: await svc.generateRoute(req.body) }); }
  catch (e) { next(e); }
};

exports.myRoutes = async (req, res, next) => {
  try { success(res, { data: await svc.getDriverRoutes(req.user.id) }); }
  catch (e) { next(e); }
};

exports.start = async (req, res, next) => {
  try { success(res, { data: await svc.startRoute(req.params.id, req.user.id) }); }
  catch (e) { next(e); }
};

exports.pickup = async (req, res, next) => {
  try {
    const data = await svc.confirmPickup({
      route_id: req.params.id, bin_id: req.body.bin_id,
      driver_id: req.user.id, notes: req.body.notes,
    });
    success(res, { message: 'Pickup confirmed', data });
  } catch (e) { next(e); }
};