const svc = require('./auth.service');
const { success } = require('../../utils/apiResponse');

async function register(req, res, next) {
  try {
    const user = await svc.register(req.body);
    success(res, { status: 201, message: 'Registered successfully', data: user });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const data = await svc.login(req.body);
    success(res, { message: 'Login successful', data });
  } catch (e) { next(e); }
}

async function refresh(req, res, next) {
  try {
    const data = await svc.refresh(req.body.refresh_token);
    success(res, { message: 'Token refreshed', data });
  } catch (e) { next(e); }
}

async function logout(req, res, next) {
  try {
    await svc.logout(req.user.id);
    success(res, { message: 'Logged out' });
  } catch (e) { next(e); }
}

async function forgot(req, res, next) {
  try {
    await svc.forgotPassword(req.body.email);
    success(res, { message: 'If account exists, reset email sent' });
  } catch (e) { next(e); }
}

async function reset(req, res, next) {
  try {
    await svc.resetPassword(req.body);
    success(res, { message: 'Password reset successful' });
  } catch (e) { next(e); }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgot,
  reset,
};