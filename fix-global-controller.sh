#!/bin/bash

echo "🔧 FIXING GLOBAL CONTROLLER"
echo "============================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd backend

# Step 1: Create global controller
echo -e "${YELLOW}Step 1: Creating globalController.js...${NC}"
cat > controllers/globalController.js << 'EOF'
const SUPPORTED_COUNTRIES = {
    'KE': { name: 'Kenya', currency: 'KES', code: '+254' },
    'US': { name: 'United States', currency: 'USD', code: '+1' },
    'GB': { name: 'United Kingdom', currency: 'GBP', code: '+44' },
    'NG': { name: 'Nigeria', currency: 'NGN', code: '+234' },
    'ZA': { name: 'South Africa', currency: 'ZAR', code: '+27' },
    'IN': { name: 'India', currency: 'INR', code: '+91' },
    'DE': { name: 'Germany', currency: 'EUR', code: '+49' },
    'FR': { name: 'France', currency: 'EUR', code: '+33' },
    'JP': { name: 'Japan', currency: 'JPY', code: '+81' },
    'AU': { name: 'Australia', currency: 'AUD', code: '+61' }
};

exports.getSupportedCountries = (req, res) => {
    const countries = Object.entries(SUPPORTED_COUNTRIES).map(([code, data]) => ({
        code, name: data.name, currency: data.currency
    }));
    res.json({ success: true, countries });
};

exports.getSupportedCurrencies = (req, res) => {
    const currencies = [...new Set(Object.values(SUPPORTED_COUNTRIES).map(c => c.currency))];
    res.json({ success: true, currencies });
};

exports.getCountryInfo = (req, res) => {
    const { code } = req.params;
    const country = SUPPORTED_COUNTRIES[code];
    if (!country) return res.status(404).json({ success: false, message: 'Country not found' });
    res.json({ success: true, country: { code, ...country } });
};

exports.getPaymentMethods = (req, res) => {
    const { country } = req.params;
    const methods = {
        'KE': ['mpesa', 'card', 'bank'],
        'US': ['stripe', 'paypal', 'ach'],
        'GB': ['stripe', 'paypal', 'faster'],
        'NG': ['paystack', 'card', 'bank']
    };
    res.json({ success: true, methods: methods[country] || ['card', 'bank'] });
};

exports.getExchangeRate = (req, res) => {
    const { from, to } = req.query;
    const rates = {
        USD: { EUR: 0.92, GBP: 0.79, KES: 150, NGN: 1550, INR: 83 },
        EUR: { USD: 1.09, GBP: 0.86, KES: 163 },
        GBP: { USD: 1.27, EUR: 1.16, KES: 190 }
    };
    const rate = rates[from]?.[to] || 1;
    res.json({ success: true, from, to, rate });
};

exports.calculateFees = (req, res) => {
    const { amount, fromCountry, toCountry, method } = req.body;
    let feePercentage = fromCountry === toCountry ? 0.005 : 0.02;
    const totalFee = amount * feePercentage + 1;
    res.json({ success: true, fees: { percentage: feePercentage * 100, fixed: 1, total: totalFee } });
};

exports.sendInternational = (req, res) => {
    const transaction = {
        transactionId: `INTL${Date.now()}`,
        ...req.body,
        status: 'processing',
        createdAt: new Date().toISOString()
    };
    res.status(201).json({ success: true, transaction });
};

exports.getTransactionStatus = (req, res) => {
    res.json({ 
        success: true, 
        transaction: {
            transactionId: req.params.id,
            status: 'completed',
            tracking: [{ status: 'completed', timestamp: new Date().toISOString() }]
        }
    });
};

exports.testController = (req, res) => {
    res.json({ success: true, message: 'Global controller is working' });
};
EOF

# Step 2: Create global routes
echo -e "${YELLOW}Step 2: Creating globalPayments.js...${NC}"
cat > routes/globalPayments.js << 'EOF'
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
EOF

# Step 3: Update server.js
echo -e "${YELLOW}Step 3: Updating server.js...${NC}"
cp server.js server.js.bak 2>/dev/null

# Check if global route is already in server.js
if ! grep -q "globalPayments" server.js; then
    sed -i "/app.use('\/api\/payments/a app.use('/api/global', require('./routes/globalPayments'));" server.js
fi

# Step 4: Install axios
echo -e "${YELLOW}Step 4: Installing axios...${NC}"
npm install axios

# Step 5: Verify
echo -e "${YELLOW}Step 5: Verifying controller...${NC}"
node -e "
try {
    const controller = require('./controllers/globalController');
    console.log('✅ Controller loaded');
    console.log('Functions:', Object.keys(controller));
} catch (e) {
    console.error('❌ Error:', e.message);
}
"

# Step 6: Commit and push
echo -e "${YELLOW}Step 6: Committing and pushing...${NC}"
cd ..
git add .
git commit -m "Add global controller and routes"
git push origin main

echo -e "${GREEN}✅ FIX COMPLETE!${NC}"
echo ""
echo "Redeploy on Render: https://dashboard.render.com"
echo ""
echo "Test your API:"
echo "  https://global-payment-api.onrender.com/api/global/test"
echo "  https://global-payment-api.onrender.com/api/global/countries"
