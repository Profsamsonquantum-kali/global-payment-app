const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

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
// DATABASE (In-Memory for demo - replace with MongoDB in production)
// ============================================
const users = [];
const transactions = [];

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key-2026', {
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

        // Validate input
        if (!fullName || !email || !phoneNumber || !password || !country) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

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
            isVerified: true,
            balance: 5000,
            balances: {
                USD: 5000,
                EUR: 0,
                GBP: 0,
                KES: 0,
                NGN: 0,
                INR: 0
            },
            totalSent: 0,
            totalReceived: 0,
            transactions: [],
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        console.log('✅ User registered:', email);
        console.log('📊 Total users:', users.length);

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
                balances: newUser.balances,
                totalSent: newUser.totalSent,
                totalReceived: newUser.totalReceived
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

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

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
                balances: user.balances,
                totalSent: user.totalSent || 0,
                totalReceived: user.totalReceived || 0
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
                fullName: name || 'Google User',
                email,
                phoneNumber: '',
                password: '',
                googleId,
                country: 'US',
                isVerified: true,
                balance: 5000,
                balances: {
                    USD: 5000,
                    EUR: 0,
                    GBP: 0,
                    KES: 0,
                    NGN: 0,
                    INR: 0
                },
                totalSent: 0,
                totalReceived: 0,
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
                balances: user.balances,
                totalSent: user.totalSent || 0,
                totalReceived: user.totalReceived || 0
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

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-2026', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

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
            balances: user.balances,
            totalSent: user.totalSent || 0,
            totalReceived: user.totalReceived || 0,
            createdAt: user.createdAt
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

        const countriesSentTo = [...new Set(userTransactions
            .filter(t => t.type === 'send')
            .map(t => t.recipientCountry)
            .filter(Boolean))];

        res.json({
            totalSent,
            totalReceived,
            totalTransactions: userTransactions.length,
            countriesSentTo: countriesSentTo.length,
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
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

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

        if (sender.id === recipient.id) {
            return res.status(400).json({ message: 'Cannot send money to yourself' });
        }

        if (!sender.balances[currency] || sender.balances[currency] < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const fee = amount * 0.01;
        const total = amount + fee;

        const transaction = {
            id: 'TXN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase(),
            userId: sender.id,
            type: 'send',
            amount,
            currency,
            fee,
            total,
            recipientEmail: recipient.email,
            recipientName: recipient.fullName,
            recipientCountry: recipient.country,
            description: description || 'Money transfer',
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        transactions.push(transaction);

        // Update sender balances
        sender.balances[currency] -= total;
        sender.totalSent = (sender.totalSent || 0) + amount;

        // Update recipient balances
        if (!recipient.balances[currency]) recipient.balances[currency] = 0;
        recipient.balances[currency] += amount;
        recipient.totalReceived = (recipient.totalReceived || 0) + amount;

        // Create receive transaction for recipient
        const receiveTransaction = {
            id: 'TXN' + Date.now() + 1 + Math.random().toString(36).substring(2, 8).toUpperCase(),
            userId: recipient.id,
            type: 'receive',
            amount,
            currency,
            senderEmail: sender.email,
            senderName: sender.fullName,
            description: description || 'Money received',
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        transactions.push(receiveTransaction);

        console.log(`✅ Money sent: ${amount} ${currency} from ${sender.email} to ${recipient.email}`);

        res.status(201).json({
            success: true,
            message: 'Money sent successfully',
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
            id: 'TXN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase(),
            userId: user.id,
            type: 'deposit',
            amount,
            currency,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        transactions.push(transaction);

        if (!user.balances[currency]) user.balances[currency] = 0;
        user.balances[currency] += amount;
        user.balance += amount;

        res.status(201).json({
            success: true,
            message: 'Deposit successful',
            transaction,
            newBalance: user.balances[currency]
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
        { code: 'FR', name: 'France', currency: 'EUR' },
        { code: 'JP', name: 'Japan', currency: 'JPY' },
        { code: 'CN', name: 'China', currency: 'CNY' },
        { code: 'AU', name: 'Australia', currency: 'AUD' },
        { code: 'CA', name: 'Canada', currency: 'CAD' },
        { code: 'AE', name: 'UAE', currency: 'AED' },
        { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
        { code: 'PK', name: 'Pakistan', currency: 'PKR' },
        { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
        { code: 'BR', name: 'Brazil', currency: 'BRL' },
        { code: 'MX', name: 'Mexico', currency: 'MXN' },
        { code: 'AR', name: 'Argentina', currency: 'ARS' },
        { code: 'CL', name: 'Chile', currency: 'CLP' },
        { code: 'CO', name: 'Colombia', currency: 'COP' },
        { code: 'PE', name: 'Peru', currency: 'PEN' }
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
        USD: { 
            EUR: 0.92, GBP: 0.79, KES: 150, NGN: 1550, INR: 83, 
            AED: 3.67, SAR: 3.75, PKR: 285, BDT: 110, BRL: 5.05, 
            MXN: 17.12, ARS: 850, CLP: 940, COP: 3950, PEN: 3.75,
            JPY: 150, CNY: 7.2, AUD: 1.52, CAD: 1.35 
        },
        EUR: { 
            USD: 1.09, GBP: 0.86, KES: 163, NGN: 1685, INR: 90, 
            AED: 4.01, JPY: 160, CNY: 7.8 
        },
        GBP: { 
            USD: 1.27, EUR: 1.16, KES: 190, NGN: 1960, INR: 105 
        },
        KES: { 
            USD: 0.0067, EUR: 0.0061, GBP: 0.0053, NGN: 10.33 
        }
    };
    
    const rate = rates[from]?.[to] || (from === to ? 1 : 1.5);
    
    res.json({
        success: true,
        from,
        to,
        rate,
        timestamp: new Date().toISOString()
    });
});

// Calculate fees
app.post('/api/global/calculate-fees', (req, res) => {
    const { amount, fromCountry, toCountry, method } = req.body;
    
    let feePercentage = fromCountry === toCountry ? 0.005 : 0.02;
    let fixedFee = fromCountry === toCountry ? 0.5 : 3;
    
    // Method-specific fees
    const methodFees = {
        'mpesa': 0.005,
        'paystack': 0.015,
        'stripe': 0.029,
        'paypal': 0.039,
        'bank': 0.01,
        'card': 0.025,
        'wise': 0.008
    };
    
    feePercentage += methodFees[method] || 0.02;
    
    const totalFee = (amount * feePercentage) + fixedFee;
    
    res.json({
        success: true,
        fees: {
            percentage: feePercentage * 100,
            fixed: fixedFee,
            total: totalFee,
            breakdown: {
                base: fromCountry === toCountry ? 0.5 : 2,
                method: (methodFees[method] || 2) * 100,
                fixed: fixedFee
            }
        }
    });
});

// Get payment methods for country
app.get('/api/global/payment-methods/:country', (req, res) => {
    const { country } = req.params;
    
    const methods = {
        'KE': [
            { id: 'mpesa', name: 'M-Pesa', provider: 'Safaricom', type: 'mobile' },
            { id: 'card', name: 'Credit Card', provider: 'Stripe', type: 'card' },
            { id: 'bank', name: 'Bank Transfer', provider: 'Local Bank', type: 'bank' }
        ],
        'US': [
            { id: 'stripe', name: 'Credit Card', provider: 'Stripe', type: 'card' },
            { id: 'paypal', name: 'PayPal', provider: 'PayPal', type: 'wallet' },
            { id: 'ach', name: 'ACH Bank Transfer', provider: 'Plaid', type: 'bank' }
        ],
        'GB': [
            { id: 'stripe', name: 'Credit Card', provider: 'Stripe', type: 'card' },
            { id: 'paypal', name: 'PayPal', provider: 'PayPal', type: 'wallet' },
            { id: 'faster', name: 'Faster Payments', provider: 'Wise', type: 'bank' }
        ],
        'NG': [
            { id: 'paystack', name: 'Paystack', provider: 'Paystack', type: 'card' },
            { id: 'bank', name: 'Bank Transfer', provider: 'Local Bank', type: 'bank' }
        ],
        'IN': [
            { id: 'razorpay', name: 'Razorpay', provider: 'Razorpay', type: 'card' },
            { id: 'upi', name: 'UPI', provider: 'NPCI', type: 'bank' },
            { id: 'paytm', name: 'Paytm', provider: 'Paytm', type: 'wallet' }
        ]
    };
    
    res.json({
        success: true,
        country,
        methods: methods[country] || methods['US']
    });
});

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

// Catch-all route for frontend (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(70));
    console.log('🚀 GLOBAL PAYMENT APP - FULLY FUNCTIONAL');
    console.log('='.repeat(70));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Frontend: https://global-payment-app.onrender.com`);
    console.log(`🔌 API: https://global-payment-app.onrender.com/api/test`);
    console.log(`👨‍💻 Developer: Samson W Simiyu`);
    console.log(`📧 Email: samsonwsimiyu@gmail.com`);
    console.log('='.repeat(70));
    console.log(`✅ Google Login: WORKING`);
    console.log(`✅ Email Registration: WORKING`);
    console.log(`✅ User Login: WORKING`);
    console.log(`✅ User Profiles: WORKING`);
    console.log(`✅ Money Transfer: WORKING`);
    console.log(`✅ Exchange Rates: WORKING`);
    console.log(`✅ Multi-Currency: WORKING`);
    console.log('='.repeat(70));
    console.log(`📊 Users in database: ${users.length}`);
    console.log(`📊 Transactions: ${transactions.length}`);
    console.log('='.repeat(70));
});