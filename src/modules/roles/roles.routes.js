const { Router } = require('express');
const rolesController = require('./roles.controller');

const router = Router();

/**
 * Role management endpoints (admin)
 */

// List all roles
router.get('/admin/roles', rolesController.listRoles);

// Create a new role
router.post('/admin/roles', rolesController.createRole);

// Get a single role by ID
router.get('/admin/roles/:roleId', rolesController.getRole);

// Update a role by ID
router.put('/admin/roles/:roleId', rolesController.updateRole);

// Delete a role by ID
router.delete('/admin/roles/:roleId', rolesController.deleteRole);

/**
 * User-role assignment endpoints (admin)
 */

// Get all roles for a user
router.get('/admin/users/:userId/roles', rolesController.getUserRoles);

// Assign a role to a user
router.post('/admin/users/:userId/roles', rolesController.assignUserRole);

// Remove a role from a user
router.delete('/admin/users/:userId/roles/:roleId', rolesController.removeUserRole);

module.exports = router;
