const { Router } = require('express');
const usersController = require('./users.controller');
const usersValidator = require('./users.validator');
const { authenticate, authorize } = require('../../middleware/auth');

const router = Router();

// ─── Current-user profile ─────────────────────────────────────────────────────
router.get('/me', authenticate, usersController.getMe);

router.patch('/me', authenticate, usersValidator.updateProfile, usersController.updateMe);

router.post(
  '/me/change-password',
  authenticate,
  usersValidator.changePassword,
  usersController.changePassword
);

// ─── Current-user address book ────────────────────────────────────────────────
router.get('/me/addresses', authenticate, usersController.getAddresses);

router.post(
  '/me/addresses',
  authenticate,
  usersValidator.createAddress,
  usersController.createAddress
);

router.get('/me/addresses/:addressId', authenticate, usersController.getAddress);

router.put(
  '/me/addresses/:addressId',
  authenticate,
  usersValidator.updateAddress,
  usersController.updateAddress
);

router.delete('/me/addresses/:addressId', authenticate, usersController.deleteAddress);

// ─── Admin user management ────────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin'), usersController.getUsers);

router.get('/:userId', authenticate, authorize('admin'), usersController.getUserById);

router.patch(
  '/:userId',
  authenticate,
  authorize('admin'),
  usersValidator.adminUpdateUser,
  usersController.updateUser
);

router.delete('/:userId', authenticate, authorize('admin'), usersController.deleteUser);

module.exports = router;
