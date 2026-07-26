const db = require('../../db');

const getAddresses = async (userId) => {
  const result = await db.query(
    `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getAddressById = async (userId, addressId) => {
  const result = await db.query(
    `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
    [addressId, userId]
  );
  return result.rows[0] || null;
};

const checkServiceability = async (pinCode) => {
  const result = await db.query(
    `SELECT pin_code FROM serviceable_pin_codes WHERE pin_code = $1 AND is_active = true LIMIT 1`,
    [pinCode]
  );
  return result.rows.length > 0;
};

const createAddress = async (userId, data) => {
  const {
    full_name,
    phone,
    address_line1,
    address_line2 = null,
    city,
    state,
    pin_code,
    label = 'home',
    is_default = false,
  } = data;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const countResult = await client.query(
      `SELECT COUNT(*) AS total FROM addresses WHERE user_id = $1`,
      [userId]
    );
    const isFirst = parseInt(countResult.rows[0].total, 10) === 0;
    const makeDefault = is_default || isFirst;

    if (makeDefault) {
      await client.query(
        `UPDATE addresses SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await client.query(
      `INSERT INTO addresses
         (user_id, full_name, phone, address_line1, address_line2, city, state, pin_code, label, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, full_name, phone, address_line1, address_line2, city, state, pin_code, label, makeDefault]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateAddress = async (userId, addressId, data) => {
  const existing = await getAddressById(userId, addressId);
  if (!existing) return null;

  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    label,
    is_default,
  } = data;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (is_default === true) {
      await client.query(
        `UPDATE addresses SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (address_line1 !== undefined) { fields.push(`address_line1 = $${idx++}`); values.push(address_line1); }
    if (address_line2 !== undefined) { fields.push(`address_line2 = $${idx++}`); values.push(address_line2); }
    if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }
    if (state !== undefined) { fields.push(`state = $${idx++}`); values.push(state); }
    if (pin_code !== undefined) { fields.push(`pin_code = $${idx++}`); values.push(pin_code); }
    if (label !== undefined) { fields.push(`label = $${idx++}`); values.push(label); }
    if (is_default !== undefined) { fields.push(`is_default = $${idx++}`); values.push(is_default); }

    fields.push(`updated_at = NOW()`);

    const addressIdIdx = idx++;
    const userIdIdx = idx++;
    values.push(addressId, userId);

    const result = await client.query(
      `UPDATE addresses
       SET ${fields.join(', ')}
       WHERE id = $${addressIdIdx} AND user_id = $${userIdIdx}
       RETURNING *`,
      values
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteAddress = async (userId, addressId) => {
  const existing = await getAddressById(userId, addressId);
  if (!existing) {
    const error = new Error('Address not found');
    error.status = 404;
    throw error;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );

    if (existing.is_default) {
      await client.query(
        `UPDATE addresses
         SET is_default = true
         WHERE id = (
           SELECT id FROM addresses
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 1
         )`,
        [userId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  checkServiceability,
};
