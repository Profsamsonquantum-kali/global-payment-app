const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true, default: 'KE' },
    isVerified: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    balances: {
        USD: { type: Number, default: 0 },
        EUR: { type: Number, default: 0 },
        GBP: { type: Number, default: 0 },
        KES: { type: Number, default: 0 }
    },
    totalSent: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
    notifications: [{
        type: { type: String },
        title: String,
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    paymentMethods: [{
        type: { type: String },
        provider: String,
        details: Object,
        createdAt: { type: Date, default: Date.now }
    }],
    trustedDevices: [{
        deviceId: String,
        deviceName: String,
        lastUsed: Date,
        ipAddress: String
    }],
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
