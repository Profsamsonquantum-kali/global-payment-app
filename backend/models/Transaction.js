const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction IDs
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  reference: {
    type: String,
    unique: true
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: String,
  userCountry: String,
  
  // Recipient Information
  recipientType: {
    type: String,
    enum: ['user', 'email', 'phone', 'bank', 'mobile', 'crypto'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientEmail: String,
  recipientPhone: String,
  recipientName: String,
  recipientCountry: String,
  
  // Bank Details
  recipientBank: {
    bankName: String,
    bankCode: String,
    branchCode: String,
    accountNumber: String,
    accountName: String,
    iban: String,
    swiftCode: String,
    routingNumber: String
  },
  
  // Mobile Money
  recipientMobile: {
    provider: String,
    number: String
  },
  
  // Amount Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  targetCurrency: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  
  // Fees
  fees: {
    transaction: { type: Number, default: 0 },
    exchange: { type: Number, default: 0 },
    transfer: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Payment Method
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank', 'mpesa', 'paypal', 'wallet', 'crypto'],
      required: true
    },
    provider: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Transfer Method
  transferMethod: {
    type: {
      type: String,
      enum: ['instant', 'standard', 'express', 'wire', 'swift', 'ach', 'sepa']
    },
    estimatedTime: String,
    trackingNumber: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Tracking
  tracking: [{
    status: String,
    location: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  
  // Provider Responses
  providerResponses: [{
    provider: String,
    reference: String,
    status: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Description
  description: String,
  notes: String,
  
  // Security
  ipAddress: String,
  userAgent: String,
  deviceId: String,
  
  // Compliance
  compliance: {
    flagged: { type: Boolean, default: false },
    reason: String,
    reviewedBy: String,
    reviewedAt: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Generate transaction ID before saving
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const prefix = 'UNI';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionId = `${prefix}${timestamp}${random}`;
  }
  
  if (!this.reference) {
    this.reference = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ 'recipientCountry': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);