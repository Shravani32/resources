const express = require('express');
const router = express.Router({ mergeParams: true });
const addressesController = require('./addresses.controller');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { createAddressSchema, updateAddressSchema } = require('./addresses.validator');

router.use(authenticate);

router.get('/', addressesController.getAddresses);
router.post('/', validate(createAddressSchema), addressesController.createAddress);
router.get('/:addressId', addressesController.getAddress);
router.put('/:addressId', validate(updateAddressSchema), addressesController.updateAddress);
router.delete('/:addressId', addressesController.deleteAddress);

module.exports = router;
