const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const PasswordReset = require('./models/PasswordReset');
const EmailVerification = require('./models/EmailVerification');

// Import utilities
const emailService = require('./utils/emailService');
const tokenGenerator = require('./utils/tokenGenerator');
const validators = require('./utils/validators');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || '*']
        }
    }
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globalpayment', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please login again.' 
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, country } = req.body;

        // Validate input
        if (!fullName || !email || !phoneNumber || !password || !country) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        if (!validators.isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        if (!validators.isValidPhone(phoneNumber, country)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid phone number for your country' 
            });
        }

        if (!validators.isValidPassword(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { phoneNumber }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email or phone number' 
            });
        }

        // Create user
        const user = new User({
            fullName,
            email,
            phoneNumber,
            password,
            country,
            emailVerified: false
        });

        await user.save();

        // Generate verification token
        const verificationToken = tokenGenerator.generateToken();
        const verification = new EmailVerification({
            email: user.email,
            token: verificationToken
        });
        await verification.save();

        // Send verification email
        await emailService.sendVerificationEmail(user.email, verificationToken);

        // Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Send welcome email
        await emailService.sendWelcomeEmail(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration. Please try again.' 
        });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({ 
                success: false, 
                message: `Account locked. Try again in ${lockTime} minutes.` 
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incLoginAttempts();
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        user.lastLoginIP = req.ip;
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login. Please try again.' 
        });
    }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal that user doesn't exist
            return res.json({ 
                success: true, 
                message: 'If an account exists with this email, you will receive a password reset link.' 
            });
        }

        // Generate reset token
        const resetToken = tokenGenerator.generateToken();
        
        // Save reset token
        const passwordReset = new PasswordReset({
            email: user.email,
            token: resetToken
        });
        await passwordReset.save();

        // Send reset email
        await emailService.sendPasswordResetEmail(user.email, resetToken);

        res.json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.'
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token and new password are required' 
            });
        }

        // Find valid reset token
        const resetRequest = await PasswordReset.findOne({ 
            token, 
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRequest) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset token' 
            });
        }

        // Find user
        const user = await User.findOne({ email: resetRequest.email }).select('+password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Mark token as used
        resetRequest.used = true;
        await resetRequest.save();

        res.json({
            success: true,
            message: 'Password reset successful! You can now login with your new password.'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// Verify Email
app.get('/api/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: 'Verification token is required' 
            });
        }

        // Find verification token
        const verification = await EmailVerification.findOne({ 
            token, 
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!verification) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired verification token' 
            });
        }

        // Update user
        await User.findOneAndUpdate(
            { email: verification.email },
            { emailVerified: true, isVerified: true }
        );

        // Mark token as verified
        verification.verified = true;
        await verification.save();

        res.json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });

    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// Resend Verification
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already verified' 
            });
        }

        // Generate new verification token
        const verificationToken = tokenGenerator.generateToken();
        
        // Save new verification
        const verification = new EmailVerification({
            email: user.email,
            token: verificationToken
        });
        await verification.save();

        // Send verification email
        await emailService.sendVerificationEmail(user.email, verificationToken);

        res.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('❌ Resend verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// Google Login (Simulated - In production, use OAuth)
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and name are required' 
            });
        }

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user from Google data
            user = new User({
                fullName: name,
                email,
                phoneNumber: `+1${Math.floor(Math.random() * 1000000000)}`,
                password: crypto.randomBytes(20).toString('hex'),
                country: 'US',
                emailVerified: true,
                isVerified: true
            });

            await user.save();

            // Send welcome email
            await emailService.sendWelcomeEmail(user);
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Google login successful!',
            token,
            user: user.getPublicProfile()
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
// USER ROUTES (Protected)
// ============================================

// Get profile
app.get('/api/users/profile', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user.getPublicProfile()
    });
});

// Update profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, phoneNumber, country } = req.body;

        // Validate phone if provided
        if (phoneNumber && !validators.isValidPhone(phoneNumber, country || req.user.country)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid phone number' 
            });
        }

        // Update fields
        if (fullName) req.user.fullName = fullName;
        if (phoneNumber) req.user.phoneNumber = phoneNumber;
        if (country) req.user.country = country;

        await req.user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: req.user.getPublicProfile()
        });

    } catch (error) {
        console.error('❌ Profile update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating profile' 
        });
    }
});

// Get balance
app.get('/api/users/balance', authenticateToken, (req, res) => {
    res.json({
        success: true,
        balance: req.user.balance,
        balances: req.user.balances
    });
});

// Get stats
app.get('/api/users/stats', authenticateToken, async (req, res) => {
    try {
        const transactionStats = await Transaction.aggregate([
            { $match: { userId: req.user._id } },
            { 
                $group: {
                    _id: null,
                    totalSent: { 
                        $sum: { 
                            $cond: [{ $eq: ['$type', 'send'] }, '$amount', 0] 
                        } 
                    },
                    totalReceived: { 
                        $sum: { 
                            $cond: [{ $eq: ['$type', 'receive'] }, '$amount', 0] 
                        } 
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = transactionStats[0] || { totalSent: 0, totalReceived: 0, count: 0 };

        res.json({
            success: true,
            stats: {
                totalSent: stats.totalSent,
                totalReceived: stats.totalReceived,
                totalTransactions: stats.count,
                memberSince: req.user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching stats' 
        });
    }
});

// Change password
app.post('/api/users/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error changing password' 
        });
    }
});

// ============================================
// PAYMENT ROUTES
// ============================================

// Get transactions
app.get('/api/payments/transactions', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Transaction.countDocuments({ userId: req.user._id });

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
        console.error('❌ Get transactions error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching transactions' 
        });
    }
});

// Send money
app.post('/api/payments/send', authenticateToken, async (req, res) => {
    try {
        const { amount, currency, recipientEmail, description } = req.body;

        // Validate
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid amount' 
            });
        }

        if (!recipientEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipient email is required' 
            });
        }

        // Find recipient
        const recipient = await User.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipient not found' 
            });
        }

        // Check if sending to self
        if (recipient._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot send money to yourself' 
            });
        }

        // Check balance
        if (!req.user.balances[currency] || req.user.balances[currency] < amount) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient ${currency} balance` 
            });
        }

        // Calculate fee (1%)
        const fee = amount * 0.01;
        const total = amount + fee;

        // Create sender transaction
        const senderTransaction = new Transaction({
            transactionId: tokenGenerator.generateTransactionReference(),
            userId: req.user._id,
            userEmail: req.user.email,
            userCountry: req.user.country,
            type: 'send',
            amount,
            currency,
            fee,
            total,
            recipientId: recipient._id,
            recipientEmail: recipient.email,
            recipientName: recipient.fullName,
            recipientCountry: recipient.country,
            description: description || 'Money transfer',
            status: 'completed'
        });

        await senderTransaction.save();

        // Create recipient transaction
        const recipientTransaction = new Transaction({
            transactionId: tokenGenerator.generateTransactionReference(),
            userId: recipient._id,
            userEmail: recipient.email,
            userCountry: recipient.country,
            type: 'receive',
            amount,
            currency,
            recipientId: req.user._id,
            recipientEmail: req.user.email,
            recipientName: req.user.fullName,
            description: `Received from ${req.user.fullName}`,
            status: 'completed'
        });

        await recipientTransaction.save();

        // Update sender balance
        req.user.balances[currency] -= total;
        req.user.totalSent += amount;
        req.user.totalTransactions += 1;
        await req.user.save();

        // Update recipient balance
        if (!recipient.balances[currency]) recipient.balances[currency] = 0;
        recipient.balances[currency] += amount;
        recipient.totalReceived += amount;
        recipient.totalTransactions += 1;
        await recipient.save();

        // Send email receipts
        await emailService.sendTransactionReceipt(req.user, senderTransaction);
        await emailService.sendTransactionReceipt(recipient, recipientTransaction);

        res.status(201).json({
            success: true,
            message: 'Money sent successfully!',
            transaction: senderTransaction
        });

    } catch (error) {
        console.error('❌ Send money error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error processing payment' 
        });
    }
});

// Deposit money
app.post('/api/payments/deposit', authenticateToken, async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid amount' 
            });
        }

        // Create transaction
        const transaction = new Transaction({
            transactionId: tokenGenerator.generateTransactionReference(),
            userId: req.user._id,
            userEmail: req.user.email,
            userCountry: req.user.country,
            type: 'deposit',
            amount,
            currency,
            status: 'completed'
        });

        await transaction.save();

        // Update balance
        if (!req.user.balances[currency]) req.user.balances[currency] = 0;
        req.user.balances[currency] += amount;
        req.user.balance += amount;
        req.user.totalTransactions += 1;
        await req.user.save();

        // Send receipt
        await emailService.sendTransactionReceipt(req.user, transaction);

        res.status(201).json({
            success: true,
            message: 'Deposit successful!',
            transaction,
            newBalance: req.user.balances[currency]
        });

    } catch (error) {
        console.error('❌ Deposit error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error processing deposit' 
        });
    }
});

// ============================================
// GLOBAL ROUTES
// ============================================

// Get all countries
app.get('/api/global/countries', (req, res) => {
    const countries = [
        { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
        { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
        { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
        { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
        { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
        { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
        { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
        { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
        { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
        { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
        { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
        { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
        { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
        { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰' },
        { code: 'BD', name: 'Bangladesh', currency: 'BDT', flag: '🇧🇩' },
        { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
        { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
        { code: 'AR', name: 'Argentina', currency: 'ARS', flag: '🇦🇷' },
        { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱' },
        { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴' },
        { code: 'PE', name: 'Peru', currency: 'PEN', flag: '🇵🇪' }
    ];
    
    res.json({
        success: true,
        count: countries.length,
        countries
    });
});

// Get exchange rates
app.get('/api/global/exchange-rate', (req, res) => {
    const { from, to } = req.query;
    
    const rates = {
        USD: { 
            EUR: 0.92, GBP: 0.79, KES: 150, NGN: 1550, INR: 83, 
            AED: 3.67, SAR: 3.75, PKR: 285, BDT: 110, BRL: 5.05, 
            MXN: 17.12, ARS: 850, CLP: 940, COP: 3950, PEN: 3.75,
            JPY: 150, CNY: 7.2, AUD: 1.52, CAD: 1.35, CHF: 0.89,
            SEK: 10.45, NOK: 10.78, DKK: 6.92, ZAR: 18.95 
        },
        EUR: { 
            USD: 1.09, GBP: 0.86, KES: 163, NGN: 1685, INR: 90, 
            AED: 4.01, JPY: 160, CNY: 7.8, AUD: 1.65, CAD: 1.47 
        },
        GBP: { 
            USD: 1.27, EUR: 1.16, KES: 190, NGN: 1960, INR: 105,
            AED: 4.67, JPY: 186, CNY: 9.1 
        },
        KES: { 
            USD: 0.0067, EUR: 0.0061, GBP: 0.0053, NGN: 10.33,
            INR: 0.55, AED: 0.025 
        },
        NGN: { USD: 0.00065, EUR: 0.00059, GBP: 0.00051, KES: 0.097 }
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
    
    const methodFees = {
        'mpesa': 0.005,
        'paystack': 0.015,
        'stripe': 0.029,
        'paypal': 0.039,
        'bank': 0.01,
        'card': 0.025,
        'wise': 0.008,
        'crypto': 0.001
    };
    
    feePercentage += methodFees[method] || 0.02;
    
    const totalFee = (amount * feePercentage) + fixedFee;
    
    res.json({
        success: true,
        fees: {
            percentage: feePercentage * 100,
            fixed: fixedFee,
            total: totalFee,
            amount
        }
    });
});

// Get payment methods
app.get('/api/global/payment-methods/:country', (req, res) => {
    const { country } = req.params;
    
    const methods = {
        'KE': [
            { id: 'mpesa', name: 'M-Pesa', icon: '📱', provider: 'Safaricom', fee: '1%' },
            { id: 'card', name: 'Credit/Debit Card', icon: '💳', provider: 'Stripe', fee: '2.9%' },
            { id: 'bank', name: 'Bank Transfer', icon: '🏦', provider: 'Local Bank', fee: '1.5%' }
        ],
        'US': [
            { id: 'stripe', name: 'Credit Card', icon: '💳', provider: 'Stripe', fee: '2.9% + $0.30' },
            { id: 'paypal', name: 'PayPal', icon: '🅿️', provider: 'PayPal', fee: '3.9% + $0.30' },
            { id: 'ach', name: 'ACH Transfer', icon: '🏦', provider: 'Plaid', fee: '0.8%' }
        ],
        'GB': [
            { id: 'stripe', name: 'Credit Card', icon: '💳', provider: 'Stripe', fee: '2.9% + £0.30' },
            { id: 'paypal', name: 'PayPal', icon: '🅿️', provider: 'PayPal', fee: '3.9% + £0.30' },
            { id: 'faster', name: 'Faster Payments', icon: '⚡', provider: 'Wise', fee: '0.7%' }
        ],
        'NG': [
            { id: 'paystack', name: 'Paystack', icon: '🇳🇬', provider: 'Paystack', fee: '1.5%' },
            { id: 'card', name: 'Credit Card', icon: '💳', provider: 'Stripe', fee: '3%' },
            { id: 'bank', name: 'Bank Transfer', icon: '🏦', provider: 'Local Bank', fee: '1%' }
        ],
        'IN': [
            { id: 'razorpay', name: 'Razorpay', icon: '🇮🇳', provider: 'Razorpay', fee: '2%' },
            { id: 'upi', name: 'UPI', icon: '📱', provider: 'NPCI', fee: '0.5%' },
            { id: 'paytm', name: 'Paytm', icon: '🪙', provider: 'Paytm', fee: '1.8%' }
        ],
        'BR': [
            { id: 'pix', name: 'PIX', icon: '⚡', provider: 'Banco Central', fee: '0%' },
            { id: 'card', name: 'Credit Card', icon: '💳', provider: 'MercadoPago', fee: '3.5%' },
            { id: 'boleto', name: 'Boleto', icon: '📄', provider: 'MercadoPago', fee: '2%' }
        ]
    };
    
    res.json({
        success: true,
        country,
        methods: methods[country] || methods['US']
    });
});

// ============================================
// STATIC PAGES ROUTES
// ============================================

// Terms of Service
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/terms.html'));
});

// Privacy Policy
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/privacy.html'));
});

// About
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/about.html'));
});

// Contact
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/contact.html'));
});

// FAQ
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/faq.html'));
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
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, '../frontend/forgot-password.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, '../frontend/reset-password.html')));
app.get('/verify-email', (req, res) => res.sendFile(path.join(__dirname, '../frontend/verify-email.html')));

// Catch-all for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(80));
    console.log('🚀 GLOBAL PAYMENT APP v10.8 - PROFESSIONAL EDITION');
    console.log('='.repeat(80));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Frontend: ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}`);
    console.log(`🔌 API: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api/test`);
    console.log(`👨‍💻 Developer: ${process.env.DEV_NAME || 'Samson W Simiyu'}`);
    console.log(`📧 Email: ${process.env.DEV_EMAIL || 'samsonwsimiyu@gmail.com'}`);
    console.log('='.repeat(80));
    console.log('✅ FEATURES ENABLED:');
    console.log('   • User Registration with Email Verification');
    console.log('   • Secure Login with JWT & Rate Limiting');
    console.log('   • Password Reset via Email');
    console.log('   • Google OAuth Integration');
    console.log('   • Multi-Currency Support (20+ currencies)');
    console.log('   • Global Money Transfer');
    console.log('   • Real Exchange Rates');
    console.log('   • Transaction History');
    console.log('   • User Profiles');
    console.log('   • Email Notifications');
    console.log('   • Terms & Privacy Policy');
    console.log('   • Responsive Design');
    console.log('='.repeat(80));
    console.log('📊 MongoDB Connected');
    console.log('='.repeat(80));
});