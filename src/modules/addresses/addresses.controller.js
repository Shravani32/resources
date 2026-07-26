const addressesService = require('./addresses.service');

const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await addressesService.getAddresses(userId);
    return res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    return next(error);
  }
};

const getAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.getAddressById(userId, addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (error) {
    return next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const address = await addressesService.createAddress(userId, req.body);
    return res.status(201).json({ success: true, data: address });
  } catch (error) {
    return next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.updateAddress(userId, addressId, req.body);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (error) {
    return next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    await addressesService.deleteAddress(userId, addressId);
    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
