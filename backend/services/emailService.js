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
        from: `"Unipay Pro" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  // Send verification email
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Welcome to Unipay Pro!</h1>
        <p>Dear ${user.fullName},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr>
        <p style="color: #718096; font-size: 12px;">
          Unipay Pro - Send money globally
        </p>
      </div>
    `;

    return this.sendEmail(user.email, 'Verify Your Email - Unipay Pro', html);
  }

  // Send password reset email
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Password Reset Request</h1>
        <p>Dear ${user.fullName},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #718096; font-size: 12px;">
          Unipay Pro - Send money globally
        </p>
      </div>
    `;

    return this.sendEmail(user.email, 'Password Reset Request - Unipay Pro', html);
  }

  // Send transaction receipt
  async sendTransactionReceipt(user, transaction) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Transaction Receipt</h1>
        <p>Dear ${user.fullName},</p>
        <p>Your transaction has been completed successfully.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Transaction Details:</h3>
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Reference:</strong> ${transaction.reference}</p>
          <p><strong>Amount Sent:</strong> ${transaction.currency} ${transaction.amount}</p>
          <p><strong>Recipient Gets:</strong> ${transaction.targetCurrency} ${transaction.targetAmount}</p>
          <p><strong>Exchange Rate:</strong> 1 ${transaction.currency} = ${transaction.exchangeRate} ${transaction.targetCurrency}</p>
          <p><strong>Fee:</strong> ${transaction.currency} ${transaction.fees.total}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> ${transaction.status}</p>
        </div>
        
        <p>Thank you for using Unipay Pro!</p>
        <hr>
        <p style="color: #718096; font-size: 12px;">
          Unipay Pro - Send money globally
        </p>
      </div>
    `;

    return this.sendEmail(user.email, `Transaction Receipt - ${transaction.transactionId}`, html);
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Welcome to Unipay Pro!</h1>
        <p>Dear ${user.fullName},</p>
        <p>Your account has been created successfully. You can now:</p>
        <ul>
          <li>Send money locally and internationally</li>
          <li>Pay bills and buy airtime</li>
          <li>Exchange currencies at great rates</li>
          <li>Track your transactions in real-time</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}" 
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Go to Dashboard
        </a>
        <p>Need help? Contact our support team.</p>
        <hr>
        <p style="color: #718096; font-size: 12px;">
          Unipay Pro - Send money globally
        </p>
      </div>
    `;

    return this.sendEmail(user.email, 'Welcome to Unipay Pro!', html);
  }
}

module.exports = new EmailService();