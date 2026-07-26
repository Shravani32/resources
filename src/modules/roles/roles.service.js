const db = require('../../db');

/**
 * Retrieve all roles.
 */
async function getRoles() {
  const { rows } = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles ORDER BY id ASC'
  );
  return rows;
}

/**
 * Retrieve a single role by ID.
 */
async function getRoleById(roleId) {
  const { rows } = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1',
    [roleId]
  );
  return rows[0] || null;
}

/**
 * Create a new role.
 */
async function createRole({ name, description }) {
  const { rows } = await db.query(
    `INSERT INTO roles (name, description, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING id, name, description, created_at, updated_at`,
    [name, description || null]
  );
  return rows[0];
}

/**
 * Update an existing role by ID.
 */
async function updateRole(roleId, { name, description }) {
  const { rows } = await db.query(
    `UPDATE roles
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, description, created_at, updated_at`,
    [roleId, name || null, description !== undefined ? description : null]
  );
  return rows[0] || null;
}

/**
 * Delete a role by ID.
 */
async function deleteRole(roleId) {
  const { rowCount } = await db.query(
    'DELETE FROM roles WHERE id = $1',
    [roleId]
  );
  return rowCount > 0;
}

/**
 * Retrieve all roles assigned to a user.
 */
async function getUserRoles(userId) {
  const { rows } = await db.query(
    `SELECT r.id, r.name, r.description, ur.assigned_at
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
     ORDER BY r.id ASC`,
    [userId]
  );
  return rows;
}

/**
 * Assign a role to a user.
 */
async function assignRoleToUser(userId, roleId) {
  const { rows } = await db.query(
    `INSERT INTO user_roles (user_id, role_id, assigned_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, role_id) DO NOTHING
     RETURNING user_id, role_id, assigned_at`,
    [userId, roleId]
  );
  return rows[0] || null;
}

/**
 * Remove a role from a user.
 */
async function removeRoleFromUser(userId, roleId) {
  const { rowCount } = await db.query(
    'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
    [userId, roleId]
  );
  return rowCount > 0;
}

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
};
