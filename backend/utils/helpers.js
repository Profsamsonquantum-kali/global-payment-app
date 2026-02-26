const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Sanitize user object (remove sensitive data)
exports.sanitizeUser = (user) => {
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.twoFactorSecret;
  delete sanitized.resetPasswordToken;
  delete sanitized.resetPasswordExpire;
  delete sanitized.emailVerificationToken;
  delete sanitized.emailVerificationExpire;
  delete sanitized.__v;
  return sanitized;
};

// Format currency
exports.formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Generate random string
exports.generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

// Generate OTP
exports.generateOTP = (length = 6) => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get client IP
exports.getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
};

// Parse user agent
exports.parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  
  // Detect browser
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // Detect OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'MacOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios')) os = 'iOS';
  
  // Detect device
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet')) device = 'Tablet';
  
  return { browser, os, device };
};

// Calculate fees
exports.calculateFees = (amount, type = 'local') => {
  let feePercentage = 0.01; // 1% default
  let fixedFee = 0;
  
  if (type === 'local') {
    feePercentage = 0.005; // 0.5%
    fixedFee = 0.5;
  } else if (type === 'international') {
    feePercentage = 0.02; // 2%
    fixedFee = 3;
  } else if (type === 'express') {
    feePercentage = 0.03; // 3%
    fixedFee = 5;
  }
  
  const fee = amount * feePercentage + fixedFee;
  
  return {
    percentage: feePercentage * 100,
    fixed: fixedFee,
    total: fee
  };
};

// Validate IBAN
exports.validateIBAN = (iban) => {
  const regex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
  return regex.test(iban.replace(/\s/g, '').toUpperCase());
};

// Validate SWIFT/BIC
exports.validateSWIFT = (swift) => {
  const regex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return regex.test(swift.toUpperCase());
};

// Mask sensitive data
exports.maskData = (data, type = 'card') => {
  if (type === 'card') {
    return `**** **** **** ${data.slice(-4)}`;
  }
  if (type === 'email') {
    const [local, domain] = data.split('@');
    return `${local.slice(0, 2)}****@${domain}`;
  }
  if (type === 'phone') {
    return `${data.slice(0, 4)}****${data.slice(-4)}`;
  }
  return data;
};

// Group transactions by date
exports.groupTransactionsByDate = (transactions) => {
  const groups = {};
  
  transactions.forEach(t => {
    const date = new Date(t.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(t);
  });
  
  return groups;
};

// Calculate totals
exports.calculateTotals = (transactions) => {
  let sent = 0;
  let received = 0;
  let fees = 0;
  
  transactions.forEach(t => {
    if (t.type === 'send' || t.type === 'withdraw') {
      sent += t.amount;
    } else if (t.type === 'receive' || t.type === 'deposit') {
      received += t.amount;
    }
    fees += t.fees?.total || 0;
  });
  
  return { sent, received, fees };
};