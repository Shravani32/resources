const { validationResult } = require('express-validator');
const usersService = require('./users.service');

const sendValidationError = (res, errors) =>
  res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });

// ─── Profile ──────────────────────────────────────────────────────────────────

const getMe = async (req, res, next) => {
  try {
    const user = await usersService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const { firstName, lastName, phone, dateOfBirth } = req.body;
    const user = await usersService.updateMe(req.user.id, {
      firstName,
      lastName,
      phone,
      dateOfBirth,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const { currentPassword, newPassword } = req.body;
    const result = await usersService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── Addresses ────────────────────────────────────────────────────────────────

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await usersService.getAddresses(req.user.id);
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
};

const getAddress = async (req, res, next) => {
  try {
    const address = await usersService.getAddressById(
      req.user.id,
      req.params.addressId
    );
    res.json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const { label, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;
    const address = await usersService.createAddress(req.user.id, {
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      isDefault,
    });
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const { label, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;
    const address = await usersService.updateAddress(
      req.user.id,
      req.params.addressId,
      { label, addressLine1, addressLine2, city, state, pincode, country, isDefault }
    );
    res.json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const result = await usersService.deleteAddress(
      req.user.id,
      req.params.addressId
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const result = await usersService.getUsers({
      page: Number(page),
      limit: Number(limit),
      role,
      search,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const { role, isActive, firstName, lastName } = req.body;
    const user = await usersService.updateUser(req.params.userId, {
      role,
      isActive,
      firstName,
      lastName,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await usersService.deleteUser(req.params.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
