const axios = require('axios');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

class RealPaymentService {
  constructor() {
    this.apis = {
      stripe: require('stripe')(process.env.STRIPE_SECRET_KEY),
      paypal: this.initPayPal(),
      wise: this.initWise(),
      plaid: this.initPlaid(),
      dwolla: this.initDwolla(),
      flutterwave: this.initFlutterwave(),
      paystack: this.initPaystack(),
      razorpay: this.initRazorpay(),
      mercadopago: this.initMercadoPago()
    };
    
    this.exchangeRates = {};
    this.supportedCountries = this.getSupportedCountries();
  }

  // Initialize PayPal
  initPayPal() {
    const paypal = require('@paypal/checkout-server-sdk');
    const environment = process.env.PAYPAL_ENV === 'production'
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
    return new paypal.core.PayPalHttpClient(environment);
  }

  // Initialize Wise
  initWise() {
    return {
      baseURL: 'https://api.transferwise.com',
      headers: { Authorization: `Bearer ${process.env.WISE_API_KEY}` }
    };
  }

  // Initialize Plaid
  initPlaid() {
    const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });
    return new PlaidApi(configuration);
  }

  // Initialize Dwolla
  initDwolla() {
    return {
      baseURL: 'https://api.dwolla.com',
      key: process.env.DWOLLA_KEY,
      secret: process.env.DWOLLA_SECRET
    };
  }

  // Initialize Flutterwave
  initFlutterwave() {
    return {
      baseURL: 'https://api.flutterwave.com/v3',
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };
  }

  // Initialize Paystack
  initPaystack() {
    return {
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };
  }

  // Initialize Razorpay
  initRazorpay() {
    const Razorpay = require('razorpay');
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Initialize MercadoPago
  initMercadoPago() {
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });
    return mercadopago;
  }

  // Get supported countries with real payment methods
  getSupportedCountries() {
    return {
      // Africa
      'KE': {
        name: 'Kenya',
        currency: 'KES',
        methods: [
          { id: 'mpesa', name: 'M-Pesa', provider: 'safaricom', type: 'mobile' },
          { id: 'card', name: 'Credit/Debit Card', provider: 'stripe', type: 'card' },
          { id: 'bank', name: 'Bank Transfer', provider: 'local', type: 'bank' }
        ]
      },
      'NG': {
        name: 'Nigeria',
        currency: 'NGN',
        methods: [
          { id: 'paystack', name: 'Paystack', provider: 'paystack', type: 'card' },
          { id: 'bank', name: 'Bank Transfer', provider: 'local', type: 'bank' },
          { id: 'paypal', name: 'PayPal', provider: 'paypal', type: 'wallet' }
        ]
      },
      'ZA': {
        name: 'South Africa',
        currency: 'ZAR',
        methods: [
          { id: 'payfast', name: 'PayFast', provider: 'payfast', type: 'card' },
          { id: 'bank', name: 'Bank Transfer', provider: 'local', type: 'bank' }
        ]
      },
      'GH': {
        name: 'Ghana',
        currency: 'GHS',
        methods: [
          { id: 'mobile', name: 'Mobile Money', provider: 'mtn', type: 'mobile' },
          { id: 'card', name: 'Credit Card', provider: 'stripe', type: 'card' }
        ]
      },
      
      // North America
      'US': {
        name: 'United States',
        currency: 'USD',
        methods: [
          { id: 'stripe', name: 'Credit Card', provider: 'stripe', type: 'card' },
          { id: 'paypal', name: 'PayPal', provider: 'paypal', type: 'wallet' },
          { id: 'ach', name: 'ACH Bank Transfer', provider: 'plaid', type: 'bank' },
          { id: 'wire', name: 'Wire Transfer', provider: 'dwolla', type: 'bank' }
        ]
      },
      'CA': {
        name: 'Canada',
        currency: 'CAD',
        methods: [
          { id: 'stripe', name: 'Credit Card', provider: 'stripe', type: 'card' },
          { id: 'paypal', name: 'PayPal', provider: 'paypal', type: 'wallet' },
          { id: 'eft', name: 'EFT', provider: 'plaid', type: 'bank' }
        ]
      },
      'MX': {
        name: 'Mexico',
        currency: 'MXN',
        methods: [
          { id: 'card', name: 'Credit Card', provider: 'stripe', type: 'card' },
          { id: 'oxxo', name: 'OXXO', provider: 'mercadopago', type: 'cash' },
          { id: 'spei', name: 'SPEI', provider: 'local', type: 'bank' }
        ]
      },
      
      // Europe
      'GB': {
        name: 'United Kingdom',
        currency: 'GBP',
        methods: [
          { id: 'card', name: 'Credit Card', provider: 'stripe', type: 'card' },
          { id: 'paypal', name: 'PayPal', provider: 'paypal', type: 'wallet' },
          { id: 'faster', name: 'Faster Payments', provider: 'wise', type: 'bank' }
        ]
      },
      'DE': {
        name: 'Germany',
        currency: 'EUR',
        methods: [
          { id: 'card', name: 'Credit Card', provider: 'stripe', type: 'card' },
          { id: 'sepa', name: 'SEPA Transfer', provider: 'wise', type: 'bank' }
        ]
      }
    };
  }

  // Get real exchange rate
  async getRealExchangeRate(from, to) {
    try {
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
      return response.data.rates[to];
    } catch (error) {
      console.error('Exchange rate error:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  }

  // Calculate real fees
  calculateRealFees(amount, fromCountry, toCountry, method) {
    const baseFee = amount * 0.02; // 2% base fee
    const fixedFee = 2.50; // Fixed fee
    const providerFee = method.provider === 'paypal' ? amount * 0.039 : amount * 0.029;
    
    return {
      base: baseFee,
      fixed: fixedFee,
      provider: providerFee,
      total: baseFee + fixedFee + providerFee,
      currency: this.supportedCountries[fromCountry]?.currency || 'USD'
    };
  }

  // Process real payment
  async processRealPayment(paymentData) {
    try {
      const { userId, amount, fromCurrency, toCurrency, fromCountry, toCountry, recipientDetails, paymentMethod, description } = paymentData;
      
      // Generate transaction reference
      const reference = crypto.randomBytes(16).toString('hex');
      
      // Get exchange rate
      const exchangeRate = await this.getRealExchangeRate(fromCurrency, toCurrency);
      const targetAmount = amount * exchangeRate;
      
      // Calculate fees
      const countryData = this.supportedCountries[fromCountry];
      const method = countryData.methods.find(m => m.id === paymentMethod);
      const fees = this.calculateRealFees(amount, fromCountry, toCountry, method);
      
      // Process with appropriate provider
      let providerResponse;
      let status = 'pending';
      let trackingInfo = {};
      
      switch(method.provider) {
        case 'stripe':
          providerResponse = await this.apis.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: fromCurrency.toLowerCase(),
            description,
            metadata: { reference, userId }
          });
          status = 'processing';
          trackingInfo = { stripeId: providerResponse.id };
          break;
          
        case 'paypal':
          const request = new paypal.orders.OrdersCreateRequest();
          request.prefer("return=representation");
          request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: {
                currency_code: fromCurrency,
                value: amount.toString()
              },
              description
            }]
          });
          providerResponse = await this.apis.paypal.execute(request);
          status = 'processing';
          trackingInfo = { paypalId: providerResponse.id };
          break;
          
        default:
          providerResponse = { id: reference, status: 'pending' };
          status = 'pending';
      }
      
      // Create transaction record
      const transaction = new Transaction({
        userId,
        transactionId: providerResponse.id || reference,
        reference,
        amount,
        currency: fromCurrency,
        targetAmount,
        targetCurrency: toCurrency,
        fromCountry,
        toCountry,
        recipientDetails,
        paymentMethod,
        description,
        status,
        fees: {
          base: fees.base,
          fixed: fees.fixed,
          provider: fees.provider,
          total: fees.total
        },
        exchangeRate,
        tracking: trackingInfo,
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
      });
      
      await transaction.save();
      
      return {
        transactionId: transaction.transactionId,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        targetAmount: transaction.targetAmount,
        targetCurrency: transaction.targetCurrency,
        status: transaction.status,
        fees: transaction.fees,
        exchangeRate: transaction.exchangeRate,
        estimatedDelivery: transaction.estimatedDelivery
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }
}

// Initialize payment service
const realPaymentService = new RealPaymentService();

// ============================================
// GET SUPPORTED COUNTRIES
// ============================================
router.get('/countries', (req, res) => {
  const countries = Object.entries(realPaymentService.supportedCountries).map(([code, data]) => ({
    code,
    name: data.name,
    currency: data.currency,
    methods: data.methods
  }));
  
  res.json({
    success: true,
    count: countries.length,
    countries
  });
});

// ============================================
// GET REAL EXCHANGE RATE
// ============================================
router.get('/exchange-rate', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ message: 'Please provide from and to currencies' });
    }
    
    const rate = await realPaymentService.getRealExchangeRate(from, to);
    
    res.json({
      success: true,
      from,
      to,
      rate,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Exchange rate error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET PAYMENT METHODS FOR COUNTRY
// ============================================
router.get('/payment-methods/:country', (req, res) => {
  try {
    const { country } = req.params;
    const countryData = realPaymentService.supportedCountries[country];
    
    if (!countryData) {
      return res.status(404).json({ message: 'Country not supported' });
    }
    
    res.json({
      success: true,
      country: countryData.name,
      currency: countryData.currency,
      methods: countryData.methods
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// CALCULATE FEES
// ============================================
router.post('/calculate-fees', (req, res) => {
  try {
    const { amount, fromCountry, toCountry, method } = req.body;
    
    if (!amount || !fromCountry || !toCountry || !method) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const fees = realPaymentService.calculateRealFees(amount, fromCountry, toCountry, method);
    
    res.json({
      success: true,
      fees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// SEND MONEY GLOBALLY (REAL)
// ============================================
router.post('/send', auth, async (req, res) => {
  try {
    const {
      amount,
      fromCurrency,
      toCurrency,
      fromCountry,
      toCountry,
      recipientDetails,
      paymentMethod,
      description
    } = req.body;
    
    // Validate required fields
    if (!amount || !fromCurrency || !toCurrency || !fromCountry || !toCountry || !recipientDetails || !paymentMethod) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['amount', 'fromCurrency', 'toCurrency', 'fromCountry', 'toCountry', 'recipientDetails', 'paymentMethod']
      });
    }
    
    // Validate amount
    if (amount < 1) {
      return res.status(400).json({ message: 'Amount must be at least 1' });
    }
    
    // Process payment with real providers
    const result = await realPaymentService.processRealPayment({
      userId: req.user.id,
      amount: parseFloat(amount),
      fromCurrency,
      toCurrency,
      fromCountry,
      toCountry,
      recipientDetails,
      paymentMethod,
      description: description || 'International transfer'
    });
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Global send error:', error);
    res.status(500).json({ 
      message: error.message || 'Payment processing failed',
      error: error.toString()
    });
  }
});

// ============================================
// GET TRANSACTION STATUS
// ============================================
router.get('/transaction/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      transactionId: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        targetAmount: transaction.targetAmount,
        targetCurrency: transaction.targetCurrency,
        status: transaction.status,
        tracking: transaction.tracking,
        fees: transaction.fees,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        estimatedDelivery: transaction.transferMethod?.estimatedTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET USER TRANSACTIONS
// ============================================
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments({ userId: req.user.id });
    
    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET COUNTRY INFO
// ============================================
router.get('/country/:code', (req, res) => {
  try {
    const { code } = req.params;
    const country = realPaymentService.supportedCountries[code];
    
    if (!country) {
      return res.status(404).json({ message: 'Country not found' });
    }
    
    res.json({
      success: true,
      country
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET ALL CURRENCIES
// ============================================
router.get('/currencies', (req, res) => {
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' }
  ];
  
  res.json({
    success: true,
    currencies
  });
});

module.exports = router;