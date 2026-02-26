const { body, validationResult } = require('express-validator');

// Validation rules
exports.validateRegistration = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('country').notEmpty().withMessage('Country is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validatePayment = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('currency').notEmpty().withMessage('Currency is required'),
  body('recipient').notEmpty().withMessage('Recipient is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateInternationalPayment = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('fromCurrency').notEmpty().withMessage('From currency is required'),
  body('toCurrency').notEmpty().withMessage('To currency is required'),
  body('fromCountry').notEmpty().withMessage('From country is required'),
  body('toCountry').notEmpty().withMessage('To country is required'),
  body('recipientDetails').notEmpty().withMessage('Recipient details are required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];