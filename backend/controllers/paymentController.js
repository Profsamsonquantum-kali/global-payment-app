const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ============================================
// TRANSACTION FUNCTIONS
// ============================================

// Get all transactions
exports.getTransactions = async (req, res) => {
    try {
        console.log('📊 Getting transactions for user:', req.user.id);
        
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.json({
            success: true,
            transactions: transactions || []
        });
    } catch (error) {
        console.error('Error in getTransactions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching transactions',
            error: error.message 
        });
    }
};

// Get single transaction
exports.getTransaction = async (req, res) => {
    try {
        console.log('🔍 Getting transaction:', req.params.id);
        
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }
        
        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        console.error('Error in getTransaction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching transaction',
            error: error.message 
        });
    }
};

// ============================================
// MONEY OPERATIONS
// ============================================

// Send money
exports.sendMoney = async (req, res) => {
    try {
        console.log('💰 Processing send money request:', req.body);
        
        const { amount, currency, recipientEmail, description } = req.body;
        
        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Please enter a valid amount' 
            });
        }
        
        if (!recipientEmail) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide recipient email' 
            });
        }
        
        // Find sender
        const sender = await User.findById(req.user.id);
        if (!sender) {
            return res.status(404).json({ 
                success: false,
                message: 'Sender not found' 
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
        
        // Check balance
        if (!sender.balances || sender.balances[currency] < amount) {
            return res.status(400).json({ 
                success: false,
                message: 'Insufficient balance' 
            });
        }
        
        // Calculate fee
        const fee = amount * 0.01;
        const total = amount + fee;
        
        // Create transaction
        const transaction = new Transaction({
            user: sender._id,
            type: 'send',
            amount,
            currency,
            fee,
            total,
            recipient: recipient.email,
            description: description || 'Money transfer',
            status: 'completed'
        });
        
        await transaction.save();
        
        // Update sender balance
        if (!sender.balances) sender.balances = {};
        sender.balances[currency] = (sender.balances[currency] || 0) - total;
        sender.totalSent = (sender.totalSent || 0) + amount;
        await sender.save();
        
        // Update recipient balance
        if (!recipient.balances) recipient.balances = {};
        recipient.balances[currency] = (recipient.balances[currency] || 0) + amount;
        recipient.totalReceived = (recipient.totalReceived || 0) + amount;
        await recipient.save();
        
        res.status(201).json({
            success: true,
            message: 'Money sent successfully',
            transaction
        });
    } catch (error) {
        console.error('Error in sendMoney:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error sending money',
            error: error.message 
        });
    }
};

// Deposit money
exports.depositMoney = async (req, res) => {
    try {
        console.log('💰 Processing deposit request:', req.body);
        
        const { amount, currency } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Please enter a valid amount' 
            });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        const transaction = new Transaction({
            user: user._id,
            type: 'deposit',
            amount,
            currency,
            status: 'completed'
        });
        
        await transaction.save();
        
        if (!user.balances) user.balances = {};
        user.balances[currency] = (user.balances[currency] || 0) + amount;
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'Deposit successful',
            transaction
        });
    } catch (error) {
        console.error('Error in depositMoney:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing deposit',
            error: error.message 
        });
    }
};

// Withdraw money
exports.withdrawMoney = async (req, res) => {
    try {
        console.log('💰 Processing withdrawal request:', req.body);
        
        const { amount, currency } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Please enter a valid amount' 
            });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        if (!user.balances || user.balances[currency] < amount) {
            return res.status(400).json({ 
                success: false,
                message: 'Insufficient balance' 
            });
        }
        
        const fee = amount * 0.01;
        const total = amount + fee;
        
        const transaction = new Transaction({
            user: user._id,
            type: 'withdraw',
            amount,
            currency,
            fee,
            total,
            status: 'pending'
        });
        
        await transaction.save();
        
        user.balances[currency] -= total;
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'Withdrawal initiated',
            transaction
        });
    } catch (error) {
        console.error('Error in withdrawMoney:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing withdrawal',
            error: error.message 
        });
    }
};

// ============================================
// EXCHANGE RATE
// ============================================

// Get exchange rate
exports.getExchangeRate = async (req, res) => {
    try {
        console.log('💱 Getting exchange rate:', req.query);
        
        const { from, to } = req.query;
        
        const rates = {
            USD: { EUR: 0.92, GBP: 0.79, KES: 150, NGN: 1550, INR: 83 },
            EUR: { USD: 1.09, GBP: 0.86, KES: 163 },
            GBP: { USD: 1.27, EUR: 1.16, KES: 190 },
            KES: { USD: 0.0067, EUR: 0.0061, GBP: 0.0053 }
        };
        
        const rate = rates[from]?.[to] || 1;
        
        res.json({
            success: true,
            from,
            to,
            rate,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in getExchangeRate:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting exchange rate',
            error: error.message 
        });
    }
};

// ============================================
// HEALTH CHECK FOR CONTROLLER
// ============================================

// Test function to verify controller is working
exports.testController = (req, res) => {
    res.json({ 
        success: true, 
        message: 'Payment controller is working',
        functions: [
            'getTransactions',
            'getTransaction',
            'sendMoney',
            'depositMoney',
            'withdrawMoney',
            'getExchangeRate',
            'testController'
        ]
    });
};
