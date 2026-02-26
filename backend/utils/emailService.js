const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Send email
    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email error:', error);
            return { success: false, error: error.message };
        }
    }

    // Welcome email
    async sendWelcomeEmail(user) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Global Payment! 🎉</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.fullName},</h2>
                        <p>Thank you for joining Global Payment! We're excited to have you on board.</p>
                        
                        <h3>What you can do:</h3>
                        <ul>
                            <li>💸 Send money to anyone, anywhere</li>
                            <li>🌍 Exchange currencies at great rates</li>
                            <li>📱 Pay bills and top up mobile</li>
                            <li>🔒 Secure and encrypted transactions</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                                Go to Dashboard
                            </a>
                        </div>
                        
                        <p>Need help? Contact our support team anytime.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Global Payment. All rights reserved.</p>
                        <p>Developer: Samson W Simiyu | samsonwsimiyu@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(user.email, 'Welcome to Global Payment!', html);
    }

    // Password reset email
    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f56565 0%, #ed8936 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello,</h2>
                        <p>We received a request to reset your password. Click the button below to proceed:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">
                                Reset Password
                            </a>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ This link will expire in 1 hour.</strong>
                            <p>If you didn't request this, please ignore this email and ensure your account is secure.</p>
                        </div>
                        
                        <p>For security reasons, never share this link with anyone.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Global Payment. All rights reserved.</p>
                        <p>Developer: Samson W Simiyu | samsonwsimiyu@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, 'Password Reset Request - Global Payment', html);
    }

    // Email verification
    async sendVerificationEmail(email, verificationToken) {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verify Your Email</h1>
                    </div>
                    <div class="content">
                        <h2>Almost there!</h2>
                        <p>Please verify your email address to activate your account and start sending money globally.</p>
                        
                        <div style="text-align: center;">
                            <a href="${verifyUrl}" class="button">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p><small>This link expires in 24 hours.</small></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Global Payment. All rights reserved.</p>
                        <p>Developer: Samson W Simiyu | samsonwsimiyu@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, 'Verify Your Email - Global Payment', html);
    }

    // Transaction receipt
    async sendTransactionReceipt(user, transaction) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
                    .receipt { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .receipt-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .total { font-size: 18px; font-weight: bold; color: #48bb78; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Transaction Receipt</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.fullName},</h2>
                        <p>Your transaction has been processed successfully.</p>
                        
                        <div class="receipt">
                            <h3>Transaction Details</h3>
                            <div class="receipt-item">
                                <span>Transaction ID:</span>
                                <strong>${transaction.transactionId}</strong>
                            </div>
                            <div class="receipt-item">
                                <span>Type:</span>
                                <strong>${transaction.type}</strong>
                            </div>
                            <div class="receipt-item">
                                <span>Amount:</span>
                                <strong>${transaction.currency} ${transaction.amount}</strong>
                            </div>
                            ${transaction.fee ? `
                            <div class="receipt-item">
                                <span>Fee:</span>
                                <strong>${transaction.currency} ${transaction.fee}</strong>
                            </div>
                            ` : ''}
                            ${transaction.total ? `
                            <div class="receipt-item total">
                                <span>Total:</span>
                                <strong>${transaction.currency} ${transaction.total}</strong>
                            </div>
                            ` : ''}
                            <div class="receipt-item">
                                <span>Status:</span>
                                <strong style="color: #48bb78;">${transaction.status}</strong>
                            </div>
                            <div class="receipt-item">
                                <span>Date:</span>
                                <strong>${new Date(transaction.createdAt).toLocaleString()}</strong>
                            </div>
                        </div>
                        
                        <p>Thank you for using Global Payment!</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Global Payment. All rights reserved.</p>
                        <p>Developer: Samson W Simiyu | samsonwsimiyu@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(user.email, `Receipt: ${transaction.transactionId}`, html);
    }
}

module.exports = new EmailService();
