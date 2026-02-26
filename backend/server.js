const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// DATABASE (In-Memory for demo)
// ============================================
const users = [];
const transactions = [];

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '30d'
    });
};

const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserById = (id) => users.find(u => u.id === id);

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, country } = req.body;

        console.log('📝 Registration attempt:', { fullName, email, country });

        // Check if user exists
        if (findUserByEmail(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            phoneNumber,
            password: hashedPassword,
            country,
            isVerified: false,
            balance: 1000,
            balances: {
                USD: 1000,
                EUR: 0,
                GBP: 0,
                KES: 0
            },
            transactions: [],
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        console.log('✅ User registered:', email);

        const token = generateToken(newUser.id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                country: newUser.country,
                isVerified: newUser.isVerified,
                balance: newUser.balance,
                balances: newUser.balances
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration' 
        });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔑 Login attempt:', email);

        const user = findUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        const token = generateToken(user.id);

        console.log('✅ Login successful:', email);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                country: user.country,
                isVerified: user.isVerified,
                balance: user.balance,
                balances: user.balances
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login' 
        });
    }
});

// Google Login
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name, googleId } = req.body;

        console.log('🌍 Google login attempt:', email);

        let user = findUserByEmail(email);

        if (!user) {
            // Create new user from Google data
            const newUser = {
                id: Date.now().toString(),
                fullName: name,
                email,
                phoneNumber: '',
                password: '',
                googleId,
                country: 'KE',
                isVerified: true,
                balance: 1000,
                balances: {
                    USD: 1000,
                    EUR: 0,
                    GBP: 0,
                    KES: 0
                },
                transactions: [],
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            user = newUser;
            console.log('✅ New user created via Google:', email);
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                country: user.country,
                isVerified: user.isVerified,
                balance: user.balance,
                balances: user.balances
            }
        });

    } catch (error) {
        console.error('❌ Google login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during Google login' 
        });
    }
});

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/users/profile', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            country: user.country,
            isVerified: user.isVerified,
            balance: user.balance,
            balances: user.balances
        });

    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
app.put('/api/users/profile', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { fullName, phoneNumber, country } = req.body;

        if (fullName) user.fullName = fullName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (country) user.country = country;

        res.json({
            success: true,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                country: user.country
            }
        });

    } catch (error) {
        console.error('❌ Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user balance
app.get('/api/users/balance', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        res.json({ 
            balance: user.balance,
            balances: user.balances 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user stats
app.get('/api/users/stats', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        const userTransactions = transactions.filter(t => t.userId === user.id);
        
        const totalSent = userTransactions
            .filter(t => t.type === 'send')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalReceived = userTransactions
            .filter(t => t.type === 'receive')
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            totalSent,
            totalReceived,
            totalTransactions: userTransactions.length,
            memberSince: user.createdAt
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// PAYMENT ROUTES
// ============================================

// Get transactions
app.get('/api/payments/transactions', authenticateToken, (req, res) => {
    try {
        const userTransactions = transactions
            .filter(t => t.userId === req.user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            transactions: userTransactions
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Send money
app.post('/api/payments/send', authenticateToken, (req, res) => {
    try {
        const { amount, currency, recipientEmail, description } = req.body;
        
        const sender = findUserById(req.user.id);
        const recipient = findUserByEmail(recipientEmail);

        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        if (sender.balances[currency] < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const fee = amount * 0.01;
        const total = amount + fee;

        const transaction = {
            id: Date.now().toString(),
            userId: sender.id,
            type: 'send',
            amount,
            currency,
            fee,
            total,
            recipient: recipient.email,
            recipientName: recipient.fullName,
            description,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        transactions.push(transaction);

        // Update balances
        sender.balances[currency] -= total;
        sender.totalSent = (sender.totalSent || 0) + amount;

        recipient.balances[currency] = (recipient.balances[currency] || 0) + amount;
        recipient.totalReceived = (recipient.totalReceived || 0) + amount;

        res.status(201).json({
            success: true,
            transaction
        });

    } catch (error) {
        console.error('❌ Send money error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Deposit money
app.post('/api/payments/deposit', authenticateToken, (req, res) => {
    try {
        const { amount, currency } = req.body;
        const user = findUserById(req.user.id);

        const transaction = {
            id: Date.now().toString(),
            userId: user.id,
            type: 'deposit',
            amount,
            currency,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        transactions.push(transaction);
        user.balances[currency] = (user.balances[currency] || 0) + amount;

        res.status(201).json({
            success: true,
            transaction
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GLOBAL ROUTES
// ============================================

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
        { code: 'AE', name: 'UAE', currency: 'AED' },
        { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
        { code: 'PK', name: 'Pakistan', currency: 'PKR' },
        { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
        { code: 'BR', name: 'Brazil', currency: 'BRL' },
        { code: 'MX', name: 'Mexico', currency: 'MXN' }
    ];
    
    res.json({
        success: true,
        countries
    });
});

// Get exchange rate
app.get('/api/global/exchange-rate', (req, res) => {
    const { from, to } = req.query;
    
    const rates = {
        USD: { EUR: 0.92, GBP: 0.79, KES: 150, NGN: 1550, INR: 83, AED: 3.67, SAR: 3.75, PKR: 285, BDT: 110, BRL: 5.05, MXN: 17.12 },
        EUR: { USD: 1.09, GBP: 0.86, KES: 163, NGN: 1685, INR: 90, AED: 4.01 },
        GBP: { USD: 1.27, EUR: 1.16, KES: 190, NGN: 1960 },
        KES: { USD: 0.0067, EUR: 0.0061, GBP: 0.0053 }
    };
    
    const rate = rates[from]?.[to] || 1;
    
    res.json({
        success: true,
        from,
        to,
        rate
    });
});

// Calculate fees
app.post('/api/global/calculate-fees', (req, res) => {
    const { amount, fromCountry, toCountry, method } = req.body;
    
    let feePercentage = fromCountry === toCountry ? 0.005 : 0.02;
    const fixedFee = fromCountry === toCountry ? 0.5 : 3;
    
    const totalFee = (amount * feePercentage) + fixedFee;
    
    res.json({
        success: true,
        fees: {
            percentage: feePercentage * 100,
            fixed: fixedFee,
            total: totalFee
        }
    });
});

// Get payment methods
app.get('/api/global/payment-methods/:country', (req, res) => {
    const { country } = req.params;
    
    const methods = {
        'KE': ['mpesa', 'card', 'bank'],
        'US': ['stripe', 'paypal', 'ach'],
        'GB': ['stripe', 'paypal', 'faster'],
        'NG': ['paystack', 'card', 'bank'],
        'IN': ['razorpay', 'upi', 'card'],
        'default': ['card', 'bank']
    };
    
    res.json({
        success: true,
        methods: methods[country] || methods.default
    });
});

// ============================================
// MIDDLEWARE
// ============================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// ============================================
// FRONTEND ROUTES
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../frontend/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../frontend/profile.html')));
app.get('/send', (req, res) => res.sendFile(path.join(__dirname, '../frontend/send.html')));
app.get('/global-send', (req, res) => res.sendFile(path.join(__dirname, '../frontend/global-send.html')));
app.get('/transactions', (req, res) => res.sendFile(path.join(__dirname, '../frontend/transactions.html')));

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 GLOBAL PAYMENT APP - FULLY FUNCTIONAL');
    console.log('='.repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Frontend: https://global-payment-app.onrender.com`);
    console.log(`🔌 API: https://global-payment-app.onrender.com/api/test`);
    console.log(`👨‍💻 Developer: Samson W Simiyu`);
    console.log(`📧 Email: samsonwsimiyu@gmail.com`);
    console.log('='.repeat(60));
    console.log(`✅ Google Login: Working`);
    console.log(`✅ User Registration: Working`);
    console.log(`✅ Money Transfer: Working`);
    console.log(`✅ Exchange Rates: Working`);
    console.log('='.repeat(60));
});
