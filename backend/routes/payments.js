const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import all controller functions
const paymentController = require('../controllers/paymentController');

// Debug: Log what's imported
console.log('📦 Payment Controller Functions:', Object.keys(paymentController));

// Test route (no auth required)
router.get('/test', paymentController.testController);

// All routes below require authentication
router.use(protect);

// Transaction routes
router.get('/transactions', paymentController.getTransactions);
router.get('/transactions/:id', paymentController.getTransaction);

// Money operations
router.post('/send', paymentController.sendMoney);
router.post('/deposit', paymentController.depositMoney);
router.post('/withdraw', paymentController.withdrawMoney);

// Exchange rate
router.get('/exchange-rate', paymentController.getExchangeRate);

module.exports = router;
