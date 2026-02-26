const crypto = require('crypto');

class TokenGenerator {
    // Generate random token
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generate numeric OTP
    static generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }

    // Generate transaction reference
    static generateTransactionReference() {
        const prefix = 'REF';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }

    // Generate API key
    static generateApiKey() {
        const prefix = 'gpay';
        const random = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now().toString(36);
        return `${prefix}_${timestamp}_${random}`;
    }

    // Generate session ID
    static generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Generate verification code
    static generateVerificationCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
}

module.exports = TokenGenerator;
