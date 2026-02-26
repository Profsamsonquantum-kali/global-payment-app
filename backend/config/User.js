const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  
  // Location
  country: {
    type: String,
    required: true,
    default: 'KE'
  },
  countryCode: {
    type: String,
    default: '+254'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Profile
  profilePicture: {
    type: String,
    default: ''
  },
  dateOfBirth: Date,
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationLevel: {
    type: String,
    enum: ['unverified', 'basic', 'advanced', 'business'],
    default: 'unverified'
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Balances (Multi-Currency)
  balances: {
    USD: { type: Number, default: 0 },
    EUR: { type: Number, default: 0 },
    GBP: { type: Number, default: 0 },
    KES: { type: Number, default: 0 },
    NGN: { type: Number, default: 0 },
    ZAR: { type: Number, default: 0 },
    INR: { type: Number, default: 0 },
    BRL: { type: Number, default: 0 },
    MXN: { type: Number, default: 0 },
    JPY: { type: Number, default: 0 },
    CNY: { type: Number, default: 0 },
    AUD: { type: Number, default: 0 },
    CAD: { type: Number, default: 0 }
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
  
  // Limits
  limits: {
    daily: { type: Number, default: 1000 },
    weekly: { type: Number, default: 5000 },
    monthly: { type: Number, default: 20000 },
    perTransaction: { type: Number, default: 500 }
  },
  
  // Security
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Reset Password
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['payment', 'security', 'promotion', 'system']
    },
    title: String,
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Payment Methods
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'bank', 'mpesa', 'paypal']
    },
    provider: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    cardLast4: String,
    cardBrand: String,
    cardExpiryMonth: String,
    cardExpiryYear: String,
    cardToken: String,
    bankName: String,
    bankCode: String,
    accountNumber: String,
    accountName: String,
    iban: String,
    swiftCode: String,
    routingNumber: String,
    mpesaNumber: String,
    paypalEmail: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    },
    lastUsed: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
  preferences: {
    defaultCurrency: {
      type: String,
      default: 'USD'
    },
    notificationEmail: {
      type: Boolean,
      default: true
    },
    notificationSMS: {
      type: Boolean,
      default: false
    }
  },
  
  // Timestamps
  lastLogin: Date,
  lastTransaction: Date,
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

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
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
    updates.$set = { lockUntil: Date.now() + 3600000 };
  }
  
  return this.updateOne(updates);
};

// Update limits based on verification level
userSchema.methods.updateLimits = function() {
  const limits = {
    unverified: { daily: 100, weekly: 500, monthly: 2000, perTransaction: 100 },
    basic: { daily: 1000, weekly: 5000, monthly: 20000, perTransaction: 500 },
    advanced: { daily: 10000, weekly: 50000, monthly: 200000, perTransaction: 5000 },
    business: { daily: 50000, weekly: 250000, monthly: 1000000, perTransaction: 25000 }
  };
  
  this.limits = limits[this.verificationLevel] || limits.unverified;
};

module.exports = mongoose.model('User', userSchema);