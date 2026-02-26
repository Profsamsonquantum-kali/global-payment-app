const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['card', 'bank', 'mpesa', 'paypal'],
    required: true
  },
  
  provider: String,
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Card Details
  cardLast4: String,
  cardBrand: String,
  cardExpiryMonth: String,
  cardExpiryYear: String,
  cardToken: String,
  
  // Bank Details
  bankName: String,
  bankCode: String,
  branchCode: String,
  accountNumber: String,
  accountName: String,
  iban: String,
  swiftCode: String,
  routingNumber: String,
  
  // M-Pesa Details
  mpesaNumber: String,
  mpesaName: String,
  
  // PayPal Details
  paypalEmail: String,
  
  // Billing Address
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'failed'],
    default: 'active'
  },
  
  // Metadata
  lastUsed: Date,
  lastFailed: Date,
  failureReason: String,
  
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

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Indexes
paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);