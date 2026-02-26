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
