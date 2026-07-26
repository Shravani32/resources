'use strict';

const authService = require('./auth.service');

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await authService.logout(userId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /auth/guest-register
 */
const guestRegister = async (req, res, next) => {
  try {
    const result = await authService.guestRegister(req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
