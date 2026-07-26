'use strict';

const express = require('express');

const authController = require('./auth.controller');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  guestRegisterSchema,
} = require('./auth.validator');

const router = express.Router();

// POST /auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /auth/logout
router.post('/logout', authController.logout);

// POST /auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// POST /auth/guest-register
router.post('/guest-register', validate(guestRegisterSchema), authController.guestRegister);

module.exports = router;
