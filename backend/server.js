const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const users = [];

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// API ROUTES (prefix with /api)
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API test
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

// Global API test
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
// MOCK AUTH API (for testing)
// ============================================

// Mock users database (in memory)

// Register
app.post('/api/auth/register', (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, country } = req.body;
        
        console.log('Registration attempt:', { fullName, email, country });
        
        // Check if user exists
        const existingUser = users.find(u => u.email === email || u.phoneNumber === phoneNumber);
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            phoneNumber,
            password, // In production, hash this!
            country,
            balance: 1000,
            balances: {
                USD: 1000,
                EUR: 0,
                GBP: 0,
                KES: 0
            },
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Create token (simple mock token)
        const token = 'mock_jwt_token_' + Date.now();
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                country: newUser.country,
                balance: newUser.balance,
                balances: newUser.balances
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration' 
        });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', email);
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        const token = 'mock_jwt_token_' + Date.now();
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                country: user.country,
                balance: user.balance,
                balances: user.balances
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login' 
        });
    }
});

// Get user profile (protected route example)
app.get('/api/users/profile', (req, res) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    // Mock response
    res.json({
        id: '123',
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        country: 'KE',
        balance: 1000,
        balances: {
            USD: 1000,
            EUR: 0,
            GBP: 0,
            KES: 0
        }
    });
});

// ============================================
// FRONTEND ROUTES
// ============================================

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve profile page
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});

// Serve send page
app.get('/send', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/send.html'));
});

// Serve global send page
app.get('/global-send', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/global-send.html'));
});

// Serve transactions page
app.get('/transactions', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/transactions.html'));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('🚀 GLOBAL PAYMENT APP');
    console.log('='.repeat(50));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api/test`);
    console.log(`👨‍💻 Developer: Samson W Simiyu`);
    console.log(`📧 Email: samsonwsimiyu@gmail.com`);
    console.log('='.repeat(50));
});

// ============================================
// AUTH API ROUTES
// ============================================

// Mock users database (in memory)
const users = [];

// Register
app.post('/api/auth/register', (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, country } = req.body;
        
        console.log('Registration attempt:', { fullName, email, country });
        
        // Check if user exists
        const existingUser = users.find(u => u.email === email || u.phoneNumber === phoneNumber);
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            phoneNumber,
            password,
            country,
            balance: 1000,
            balances: {
                USD: 1000,
                EUR: 0,
                GBP: 0,
                KES: 0
            },
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Create token
        const token = 'mock_jwt_token_' + Date.now();
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                country: newUser.country,
                balance: newUser.balance,
                balances: newUser.balances
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration' 
        });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', email);
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        const token = 'mock_jwt_token_' + Date.now();
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                country: user.country,
                balance: user.balance,
                balances: user.balances
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login' 
        });
    }
});

// Get user profile
app.get('/api/users/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    // Mock response
    res.json({
        id: '123',
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        country: 'KE',
        balance: 1000,
        balances: {
            USD: 1000,
            EUR: 0,
            GBP: 0,
            KES: 0
        }
    });
});
