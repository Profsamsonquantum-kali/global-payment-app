const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// SIMPLE TEST ROUTES
// ============================================

// Root route
app.get('/', (req, res) => {
    res.json({
        name: 'Global Payment API',
        version: '1.0.0',
        status: 'running',
        developer: 'Samson W Simiyu',
        email: 'samsonwsimiyu@gmail.com',
        endpoints: {
            health: '/health',
            test: '/api/test',
            global: '/api/global/test',
            countries: '/api/global/countries'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// GLOBAL API ROUTES
// ============================================

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working',
        timestamp: new Date().toISOString()
    });
});

// Get all countries
app.get('/api/global/countries', (req, res) => {
    const countries = [
        { code: 'KE', name: 'Kenya', currency: 'KES' },
        { code: 'US', name: 'United States', currency: 'USD' },
        { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
        { code: 'NG', name: 'Nigeria', currency: 'NGN' },
        { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
        { code: 'IN', name: 'India', currency: 'INR' },
        { code: 'DE', name: 'Germany', currency: 'EUR' },
        { code: 'JP', name: 'Japan', currency: 'JPY' },
        { code: 'AU', name: 'Australia', currency: 'AUD' },
        { code: 'AE', name: 'UAE', currency: 'AED' }
    ];
    
    res.json({
        success: true,
        count: countries.length,
        countries
    });
});

// Get exchange rate
app.get('/api/global/exchange-rate', (req, res) => {
    const { from, to } = req.query;
    
    if (!from || !to) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please provide from and to currencies' 
        });
    }
    
    const rates = {
        USD: { EUR: 0.92, GBP: 0.79, KES: 150, NGN: 1550, INR: 83, AED: 3.67 },
        EUR: { USD: 1.09, GBP: 0.86, KES: 163 },
        GBP: { USD: 1.27, EUR: 1.16, KES: 190 },
        KES: { USD: 0.0067, EUR: 0.0061, GBP: 0.0053 }
    };
    
    const rate = rates[from]?.[to] || 1;
    
    res.json({
        success: true,
        from,
        to,
        rate,
        timestamp: new Date().toISOString()
    });
});

// Global test route
app.get('/api/global/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Global API is working',
        endpoints: [
            '/api/global/countries',
            '/api/global/exchange-rate?from=USD&to=KES'
        ]
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('🚀 GLOBAL PAYMENT API');
    console.log('='.repeat(50));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Health: http://localhost:${PORT}/health`);
    console.log(`🌍 Test: http://localhost:${PORT}/api/test`);
    console.log(`👨‍💻 Developer: Samson W Simiyu`);
    console.log(`📧 Email: samsonwsimiyu@gmail.com`);
    console.log('='.repeat(50));
});
