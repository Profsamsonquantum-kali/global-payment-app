const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Personal Information
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    
    // Location
    country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'KE'
    },
    currency: {
        type: String,
        default: 'USD'
    },
    
    // Profile
    profilePicture: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200'
    },
    
    // Verification
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    
    // Email Verification
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    
    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // Two Factor
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    
    // Balances
    balance: {
        type: Number,
        default: 5000
    },
    balances: {
        USD: { type: Number, default: 5000 },
        EUR: { type: Number, default: 0 },
        GBP: { type: Number, default: 0 },
        KES: { type: Number, default: 0 },
        NGN: { type: Number, default: 0 },
        INR: { type: Number, default: 0 },
        AED: { type: Number, default: 0 },
        SAR: { type: Number, default: 0 }
    },
    
    // Statistics
    totalSent: {
        type: Number,
        default: 0
    },
    totalReceived: {
        type: Number,
        default: 0
    },
    totalTransactions: {
        type: Number,
        default: 0
    },
    countriesSentTo: [String],
    
    // Preferences
    preferences: {
        language: { type: String, default: 'en' },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        },
        theme: { type: String, default: 'light' }
    },
    
    // Security
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    lastLoginIP: String,
    
    // Devices
    devices: [{
        deviceId: String,
        deviceName: String,
        browser: String,
        os: String,
        ip: String,
        lastUsed: { type: Date, default: Date.now },
        isTrusted: { type: Boolean, default: false }
    }],
    
    // Notifications
    notifications: [{
        type: {
            type: String,
            enum: ['payment', 'security', 'promotion', 'system']
        },
        title: String,
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Payment Methods
    paymentMethods: [{
        type: {
            type: String,
            enum: ['card', 'bank', 'mpesa', 'paypal', 'crypto']
        },
        provider: String,
        isDefault: { type: Boolean, default: false },
        last4: String,
        expiryMonth: String,
        expiryYear: String,
        bankName: String,
        accountNumber: String,
        routingNumber: String,
        swiftCode: String,
        iban: String,
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update timestamps
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // Lock for 30 minutes
    }
    
    return this.updateOne(updates);
};

// Generate auth token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            email: this.email,
            fullName: this.fullName 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Get public profile (remove sensitive data)
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpire;
    delete userObject.emailVerificationToken;
    delete userObject.emailVerificationExpire;
    delete userObject.twoFactorSecret;
    delete userObject.loginAttempts;
    delete userObject.lockUntil;
    delete userObject.__v;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
