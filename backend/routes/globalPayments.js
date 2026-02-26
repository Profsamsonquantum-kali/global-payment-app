const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const globalController = require('../controllers/globalController');

router.get('/test', globalController.testController);

router.get('/countries', globalController.getSupportedCountries);
router.get('/currencies', globalController.getSupportedCurrencies);
router.get('/country/:code', globalController.getCountryInfo);
router.get('/exchange-rate', globalController.getExchangeRate);

router.use(protect);

router.get('/payment-methods/:country', globalController.getPaymentMethods);
router.post('/calculate-fees', globalController.calculateFees);
router.post('/send', globalController.sendInternational);
router.get('/transaction/:id', globalController.getTransactionStatus);

module.exports = router;
