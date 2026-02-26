const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook (needs raw body)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.stripeWebhook);

// PayPal webhook
router.post('/paypal', webhookController.paypalWebhook);

// M-Pesa webhook
router.post('/mpesa', webhookController.mpesaWebhook);

// Bank transfer webhook
router.post('/bank', webhookController.bankWebhook);

module.exports = router;