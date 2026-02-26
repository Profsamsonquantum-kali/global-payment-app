#!/bin/bash

echo "🔧 FIXING USER CONTROLLER ERROR"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd backend

# Step 1: Create userController.js
echo -e "${YELLOW}Step 1: Creating userController.js...${NC}"
cat > controllers/userController.js << 'EOF'
const User = require('../models/User');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber, country } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullName, phoneNumber, country },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('balance balances');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('totalSent totalReceived createdAt');
        const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
        res.json({
            totalSent: user.totalSent || 0,
            totalReceived: user.totalReceived || 0,
            accountAge,
            memberSince: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notifications');
        res.json(user.notifications || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.user.id, 'notifications._id': req.params.id },
            { $set: { 'notifications.$.read': true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
EOF

# Step 2: Update routes/users.js
echo -e "${YELLOW}Step 2: Updating routes/users.js...${NC}"
cat > routes/users.js << 'EOF'
const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getBalance,
    getStats,
    getNotifications,
    markNotificationRead
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/balance', getBalance);
router.get('/stats', getStats);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
EOF

# Step 3: Update User model
echo -e "${YELLOW}Step 3: Updating User model...${NC}"

# Check if User model exists and update it
if [ -f models/User.js ]; then
    # Backup original
    cp models/User.js models/User.js.backup
    
    # Create enhanced User model
    cat > models/User.js << 'EOF'
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
EOF
    echo -e "${GREEN}✅ User model updated${NC}"
else
    echo "❌ User model not found. Please create it first."
fi

# Step 4: Verify file structure
echo -e "${YELLOW}Step 4: Verifying file structure...${NC}"
echo "Controllers:"
ls -la controllers/
echo ""
echo "Routes:"
ls -la routes/
echo ""
echo "Models:"
ls -la models/

# Step 5: Install dependencies if needed
echo -e "${YELLOW}Step 5: Ensuring dependencies are installed...${NC}"
npm install

# Step 6: Commit and push
echo -e "${YELLOW}Step 6: Committing and pushing to GitHub...${NC}"
cd ..
git add .
git commit -m "Fix: Add userController and update routes"
git push origin main

echo -e "${GREEN}✅ FIX COMPLETE!${NC}"
echo ""
echo "Now go to Render.com and manually redeploy:"
echo "1. https://dashboard.render.com"
echo "2. Click on your backend service"
echo "3. Manual Deploy → Deploy latest commit"
echo ""
echo "📱 Your app will be live at: https://global-payment-app.onrender.com"
echo "👨‍💻 Developer: Samson W Simiyu"
echo "📧 Email: samsonwsimiyu@gmail.com"
