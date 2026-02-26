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
