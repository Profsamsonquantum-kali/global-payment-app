// Supported countries with their details
exports.SUPPORTED_COUNTRIES = {
  // Africa
  KE: { name: 'Kenya', currency: 'KES', code: '+254', continent: 'Africa' },
  NG: { name: 'Nigeria', currency: 'NGN', code: '+234', continent: 'Africa' },
  ZA: { name: 'South Africa', currency: 'ZAR', code: '+27', continent: 'Africa' },
  GH: { name: 'Ghana', currency: 'GHS', code: '+233', continent: 'Africa' },
  TZ: { name: 'Tanzania', currency: 'TZS', code: '+255', continent: 'Africa' },
  UG: { name: 'Uganda', currency: 'UGX', code: '+256', continent: 'Africa' },
  RW: { name: 'Rwanda', currency: 'RWF', code: '+250', continent: 'Africa' },
  ET: { name: 'Ethiopia', currency: 'ETB', code: '+251', continent: 'Africa' },
  EG: { name: 'Egypt', currency: 'EGP', code: '+20', continent: 'Africa' },
  MA: { name: 'Morocco', currency: 'MAD', code: '+212', continent: 'Africa' },
  
  // North America
  US: { name: 'United States', currency: 'USD', code: '+1', continent: 'North America' },
  CA: { name: 'Canada', currency: 'CAD', code: '+1', continent: 'North America' },
  MX: { name: 'Mexico', currency: 'MXN', code: '+52', continent: 'North America' },
  
  // South America
  BR: { name: 'Brazil', currency: 'BRL', code: '+55', continent: 'South America' },
  AR: { name: 'Argentina', currency: 'ARS', code: '+54', continent: 'South America' },
  CO: { name: 'Colombia', currency: 'COP', code: '+57', continent: 'South America' },
  CL: { name: 'Chile', currency: 'CLP', code: '+56', continent: 'South America' },
  PE: { name: 'Peru', currency: 'PEN', code: '+51', continent: 'South America' },
  
  // Europe
  GB: { name: 'United Kingdom', currency: 'GBP', code: '+44', continent: 'Europe' },
  DE: { name: 'Germany', currency: 'EUR', code: '+49', continent: 'Europe' },
  FR: { name: 'France', currency: 'EUR', code: '+33', continent: 'Europe' },
  IT: { name: 'Italy', currency: 'EUR', code: '+39', continent: 'Europe' },
  ES: { name: 'Spain', currency: 'EUR', code: '+34', continent: 'Europe' },
  NL: { name: 'Netherlands', currency: 'EUR', code: '+31', continent: 'Europe' },
  CH: { name: 'Switzerland', currency: 'CHF', code: '+41', continent: 'Europe' },
  SE: { name: 'Sweden', currency: 'SEK', code: '+46', continent: 'Europe' },
  NO: { name: 'Norway', currency: 'NOK', code: '+47', continent: 'Europe' },
  DK: { name: 'Denmark', currency: 'DKK', code: '+45', continent: 'Europe' },
  
  // Asia
  JP: { name: 'Japan', currency: 'JPY', code: '+81', continent: 'Asia' },
  CN: { name: 'China', currency: 'CNY', code: '+86', continent: 'Asia' },
  IN: { name: 'India', currency: 'INR', code: '+91', continent: 'Asia' },
  KR: { name: 'South Korea', currency: 'KRW', code: '+82', continent: 'Asia' },
  SG: { name: 'Singapore', currency: 'SGD', code: '+65', continent: 'Asia' },
  MY: { name: 'Malaysia', currency: 'MYR', code: '+60', continent: 'Asia' },
  TH: { name: 'Thailand', currency: 'THB', code: '+66', continent: 'Asia' },
  VN: { name: 'Vietnam', currency: 'VND', code: '+84', continent: 'Asia' },
  PH: { name: 'Philippines', currency: 'PHP', code: '+63', continent: 'Asia' },
  ID: { name: 'Indonesia', currency: 'IDR', code: '+62', continent: 'Asia' },
  PK: { name: 'Pakistan', currency: 'PKR', code: '+92', continent: 'Asia' },
  BD: { name: 'Bangladesh', currency: 'BDT', code: '+880', continent: 'Asia' },
  LK: { name: 'Sri Lanka', currency: 'LKR', code: '+94', continent: 'Asia' },
  
  // Middle East
  AE: { name: 'UAE', currency: 'AED', code: '+971', continent: 'Middle East' },
  SA: { name: 'Saudi Arabia', currency: 'SAR', code: '+966', continent: 'Middle East' },
  QA: { name: 'Qatar', currency: 'QAR', code: '+974', continent: 'Middle East' },
  KW: { name: 'Kuwait', currency: 'KWD', code: '+965', continent: 'Middle East' },
  IL: { name: 'Israel', currency: 'ILS', code: '+972', continent: 'Middle East' },
  TR: { name: 'Turkey', currency: 'TRY', code: '+90', continent: 'Middle East' },
  
  // Oceania
  AU: { name: 'Australia', currency: 'AUD', code: '+61', continent: 'Oceania' },
  NZ: { name: 'New Zealand', currency: 'NZD', code: '+64', continent: 'Oceania' }
};

// Transaction statuses
exports.TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment methods
exports.PAYMENT_METHODS = {
  CARD: 'card',
  BANK: 'bank',
  MPESA: 'mpesa',
  PAYPAL: 'paypal',
  WALLET: 'wallet',
  CRYPTO: 'crypto'
};

// Transfer types
exports.TRANSFER_TYPES = {
  LOCAL: 'local',
  INTERNATIONAL: 'international',
  EXPRESS: 'express'
};

// Verification levels
exports.VERIFICATION_LEVELS = {
  UNVERIFIED: 'unverified',
  BASIC: 'basic',
  ADVANCED: 'advanced',
  BUSINESS: 'business'
};

// Default limits per verification level
exports.DEFAULT_LIMITS = {
  unverified: { daily: 100, weekly: 500, monthly: 2000, perTransaction: 100 },
  basic: { daily: 1000, weekly: 5000, monthly: 20000, perTransaction: 500 },
  advanced: { daily: 10000, weekly: 50000, monthly: 200000, perTransaction: 5000 },
  business: { daily: 50000, weekly: 250000, monthly: 1000000, perTransaction: 25000 }
};

// Currency symbols
exports.CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  KES: 'KSh',
  NGN: '₦',
  ZAR: 'R',
  BRL: 'R$',
  MXN: '$',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  AED: 'د.إ',
  SAR: 'ر.س',
  PKR: '₨',
  BDT: '৳'
};

// Error messages
exports.ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  ACCOUNT_LOCKED: 'Account locked. Too many failed attempts',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INVALID_AMOUNT: 'Invalid amount',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_TOKEN: 'Invalid token',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  DUPLICATE_ENTRY: 'Duplicate entry',
  NOT_FOUND: 'Resource not found',
  PAYMENT_FAILED: 'Payment failed',
  TRANSACTION_FAILED: 'Transaction failed'
};