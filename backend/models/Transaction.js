const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    
    // User Info
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: String,
    userCountry: String,
    
    // Transaction Type
    type: {
        type: String,
        enum: ['send', 'receive', 'deposit', 'withdraw', 'exchange', 'payment'],
        required: true
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
    
    // Target (for exchanges)
    targetCurrency: String,
    targetAmount: Number,
    exchangeRate: Number,
    
    // Fees
    fee: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    
    // Recipient Info
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipientEmail: String,
    recipientName: String,
    recipientCountry: String,
    
    // Payment Method
    paymentMethod: {
        type: String,
        enum: ['card', 'bank', 'mpesa', 'paypal', 'crypto', 'wallet']
    },
    paymentDetails: mongoose.Schema.Types.Mixed,
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    // Description
    description: String,
    notes: String,
    
    // Tracking
    tracking: [{
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    
    // Security
    ipAddress: String,
    userAgent: String,
    
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
        const prefix = 'TXN';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `${prefix}${timestamp}${random}`;
    }
    
    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    
    this.updatedAt = new Date();
    next();
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ status: 1 });
transactionSchema.index({ recipientEmail: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
