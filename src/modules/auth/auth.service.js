'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../db');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const RESET_TOKEN_EXPIRES_MINUTES = 60;

/**
 * Issue a signed JWT for the given user record.
 * @param {{ id: number|string, role: string, is_guest: boolean }} user
 * @returns {string}
 */
const issueToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, is_guest: Boolean(user.is_guest) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

/**
 * Create a new customer account.
 */
const register = async ({ name, email, password, phone }) => {
  const existing = await db('users').where({ email }).first();
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db('users')
    .insert({
      name,
      email,
      password_hash,
      phone: phone || null,
      role: 'customer',
      is_guest: false,
    })
    .returning(['id', 'name', 'email', 'phone', 'role', 'is_guest', 'created_at']);

  const token = issueToken(user);
  return { user, token };
};

/**
 * Authenticate a registered user and return a JWT.
 */
const login = async ({ email, password }) => {
  const user = await db('users').where({ email }).first();

  if (!user || user.is_guest) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const { password_hash, ...safeUser } = user;
  const token = issueToken(safeUser);
  return { user: safeUser, token };
};

/**
 * Stateless logout — client is responsible for discarding the token.
 * Extend with a token-blacklist store if required.
 */
const logout = async (_userId) => ({ message: 'Logged out successfully' });

/**
 * Initiate the forgot-password flow.
 * Always responds with a generic message to prevent email enumeration.
 */
const forgotPassword = async ({ email }) => {
  const GENERIC_RESPONSE = {
    message: 'If that email is registered you will receive a password reset link shortly',
  };

  const user = await db('users').where({ email, is_guest: false }).first();
  if (!user) return GENERIC_RESPONSE;

  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

  await db('password_reset_tokens').where({ user_id: user.id }).delete();
  await db('password_reset_tokens').insert({ user_id: user.id, token, expires_at });

  // Dispatch email via mailer service (not in scope of this module)
  // mailer.sendPasswordReset(user.email, token);

  return GENERIC_RESPONSE;
};

/**
 * Consume a password-reset token and update the user's password.
 */
const resetPassword = async ({ token, password }) => {
  const record = await db('password_reset_tokens')
    .where({ token })
    .where('expires_at', '>', new Date())
    .first();

  if (!record) {
    const err = new Error('Invalid or expired password reset token');
    err.status = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  await db('users').where({ id: record.user_id }).update({ password_hash });
  await db('password_reset_tokens').where({ token }).delete();

  return { message: 'Password reset successfully' };
};

/**
 * Register or re-use a guest account and return a short-lived guest JWT.
 */
const guestRegister = async ({ name, email, phone }) => {
  const existing = await db('users').where({ email }).first();

  if (existing && !existing.is_guest) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  let user;

  if (existing && existing.is_guest) {
    const [updated] = await db('users')
      .where({ id: existing.id })
      .update({ name, phone: phone || null })
      .returning(['id', 'name', 'email', 'phone', 'role', 'is_guest', 'created_at']);
    user = updated;
  } else {
    const [created] = await db('users')
      .insert({
        name,
        email,
        phone: phone || null,
        role: 'customer',
        is_guest: true,
        password_hash: null,
      })
      .returning(['id', 'name', 'email', 'phone', 'role', 'is_guest', 'created_at']);
    user = created;
  }

  const token = issueToken(user);
  return { user, token };
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
