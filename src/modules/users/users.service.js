const bcrypt = require('bcryptjs');
const db = require('../../db');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const USER_PUBLIC_FIELDS = 'id, email, first_name, last_name, phone, date_of_birth, role, is_active, created_at, updated_at';
const ADDRESS_FIELDS = 'id, user_id, label, address_line1, address_line2, city, state, pincode, country, is_default, created_at, updated_at';

// ─── Profile ──────────────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const result = await db.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1 AND is_active = true`,
    [userId]
  );
  if (!result.rows[0]) {
    throw createError('User not found', 404);
  }
  return result.rows[0];
};

const updateMe = async (userId, data) => {
  const { firstName, lastName, phone, dateOfBirth } = data;

  const updates = [];
  const values = [];
  let idx = 1;

  if (firstName !== undefined) {
    updates.push(`first_name = $${idx++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${idx++}`);
    values.push(lastName);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${idx++}`);
    values.push(phone);
  }
  if (dateOfBirth !== undefined) {
    updates.push(`date_of_birth = $${idx++}`);
    values.push(dateOfBirth);
  }

  if (updates.length === 0) {
    return getMe(userId);
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} AND is_active = true RETURNING ${USER_PUBLIC_FIELDS}`,
    values
  );

  if (!result.rows[0]) {
    throw createError('User not found', 404);
  }

  return result.rows[0];
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await db.query(
    'SELECT id, password_hash FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    throw createError('User not found', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw createError('Current password is incorrect', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  );

  return { message: 'Password changed successfully' };
};

// ─── Addresses ────────────────────────────────────────────────────────────────

const getAddresses = async (userId) => {
  const result = await db.query(
    `SELECT ${ADDRESS_FIELDS} FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getAddressById = async (userId, addressId) => {
  const result = await db.query(
    `SELECT ${ADDRESS_FIELDS} FROM addresses WHERE id = $1 AND user_id = $2`,
    [addressId, userId]
  );
  if (!result.rows[0]) {
    throw createError('Address not found', 404);
  }
  return result.rows[0];
};

const createAddress = async (userId, data) => {
  const {
    label = null,
    addressLine1,
    addressLine2 = null,
    city,
    state,
    pincode,
    country = 'India',
    isDefault = false,
  } = data;

  if (isDefault) {
    await db.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );
  }

  const result = await db.query(
    `INSERT INTO addresses (user_id, label, address_line1, address_line2, city, state, pincode, country, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${ADDRESS_FIELDS}`,
    [userId, label, addressLine1, addressLine2, city, state, pincode, country, isDefault]
  );

  return result.rows[0];
};

const updateAddress = async (userId, addressId, data) => {
  await getAddressById(userId, addressId);

  const { label, addressLine1, addressLine2, city, state, pincode, country, isDefault } = data;

  if (isDefault === true) {
    await db.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );
  }

  const result = await db.query(
    `UPDATE addresses SET
       label           = COALESCE($1, label),
       address_line1   = COALESCE($2, address_line1),
       address_line2   = COALESCE($3, address_line2),
       city            = COALESCE($4, city),
       state           = COALESCE($5, state),
       pincode         = COALESCE($6, pincode),
       country         = COALESCE($7, country),
       is_default      = COALESCE($8, is_default),
       updated_at      = NOW()
     WHERE id = $9 AND user_id = $10
     RETURNING ${ADDRESS_FIELDS}`,
    [label, addressLine1, addressLine2, city, state, pincode, country, isDefault, addressId, userId]
  );

  return result.rows[0];
};

const deleteAddress = async (userId, addressId) => {
  await getAddressById(userId, addressId);

  await db.query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );

  return { message: 'Address deleted successfully' };
};

// ─── Admin ────────────────────────────────────────────────────────────────────

const getUsers = async ({ page = 1, limit = 20, role, search } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (role) {
    conditions.push(`role = $${idx++}`);
    values.push(role);
  }

  if (search) {
    conditions.push(
      `(email ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx})`
    );
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countValues = [...values];

  values.push(limit, offset);

  const [usersResult, countResult] = await Promise.all([
    db.query(
      `SELECT ${USER_PUBLIC_FIELDS} FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    ),
    db.query(`SELECT COUNT(*) FROM users ${where}`, countValues),
  ]);

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page: Number(page),
    limit: Number(limit),
  };
};

const getUserById = async (userId) => {
  const result = await db.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    throw createError('User not found', 404);
  }
  return result.rows[0];
};

const updateUser = async (userId, data) => {
  const { role, isActive, firstName, lastName } = data;

  const updates = [];
  const values = [];
  let idx = 1;

  if (role !== undefined) {
    updates.push(`role = $${idx++}`);
    values.push(role);
  }
  if (isActive !== undefined) {
    updates.push(`is_active = $${idx++}`);
    values.push(isActive);
  }
  if (firstName !== undefined) {
    updates.push(`first_name = $${idx++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${idx++}`);
    values.push(lastName);
  }

  if (updates.length === 0) {
    return getUserById(userId);
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING ${USER_PUBLIC_FIELDS}`,
    values
  );

  if (!result.rows[0]) {
    throw createError('User not found', 404);
  }

  return result.rows[0];
};

const deleteUser = async (userId) => {
  const result = await db.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [userId]
  );
  if (!result.rows[0]) {
    throw createError('User not found', 404);
  }
  return { message: 'User deleted successfully' };
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
