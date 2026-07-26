const Joi = require('joi');

const createAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required(),
  address_line1: Joi.string().trim().min(5).max(255).required(),
  address_line2: Joi.string().trim().max(255).allow('', null).optional(),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  pin_code: Joi.string().trim().pattern(/^\d{6}$/).required(),
  label: Joi.string().valid('home', 'work', 'other').default('home'),
  is_default: Joi.boolean().default(false),
});

const updateAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/),
  address_line1: Joi.string().trim().min(5).max(255),
  address_line2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().min(2).max(100),
  state: Joi.string().trim().min(2).max(100),
  pin_code: Joi.string().trim().pattern(/^\d{6}$/),
  label: Joi.string().valid('home', 'work', 'other'),
  is_default: Joi.boolean(),
}).min(1);

module.exports = {
  createAddressSchema,
  updateAddressSchema,
};
