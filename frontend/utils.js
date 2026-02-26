// ============================================
// UNIPAY PRO - COMPLETE UTILITY FUNCTIONS
// ============================================

// ===== VALIDATORS =====
const Validators = {
    // Email validation
    email: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Phone number validation by country
    phone: (phone, country = 'KE') => {
        const patterns = {
            'KE': /^(\+254|0)[17]\d{8}$/,
            'US': /^(\+1|1)?\d{10}$/,
            'GB': /^(\+44|0)\d{10}$/,
            'NG': /^(\+234|0)\d{10}$/,
            'IN': /^(\+91|0)?[6-9]\d{9}$/,
            'KE': /^(\+254|0)[17]\d{8}$/
        };
        return (patterns[country] || patterns.KE).test(phone);
    },
    
    // Password validation
    password: (password) => {
        return password.length >= 6;
    },
    
    // Amount validation
    amount: (amount, min = 1, max = 1000000) => {
        const num = parseFloat(amount);
        return !isNaN(num) && num >= min && num <= max;
    },
    
    // IBAN validation
    iban: (iban) => {
        const re = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
        return re.test(iban.replace(/\s/g, '').toUpperCase());
    },
    
    // SWIFT/BIC validation
    swift: (swift) => {
        const re = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        return re.test(swift.toUpperCase());
    },
    
    // Card number validation (Luhn algorithm)
    cardNumber: (number) => {
        const cleaned = number.replace(/\D/g, '');
        if (!/^\d{16}$/.test(cleaned)) return false;
        
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    },
    
    // CVV validation
    cvv: (cvv) => {
        const re = /^\d{3,4}$/;
        return re.test(cvv);
    },
    
    // Expiry date validation (MM/YY)
    expiry: (expiry) => {
        const re = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!re.test(expiry)) return false;
        
        const [month, year] = expiry.split('/');
        const now = new Date();
        const expYear = 2000 + parseInt(year);
        const expMonth = parseInt(month);
        
        return expYear > now.getFullYear() || 
               (expYear === now.getFullYear() && expMonth >= now.getMonth() + 1);
    },
    
    // URL validation
    url: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

// ===== FORMATTERS =====
const Formatters = {
    // Currency formatting
    currency: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    },
    
    // Number formatting with decimals
    number: (num, decimals = 2) => {
        return Number(num).toFixed(decimals);
    },
    
    // Phone number formatting by country
    phone: (phone, country = 'KE') => {
        const cleaned = phone.replace(/\D/g, '');
        
        const formats = {
            'KE': (p) => {
                if (p.length === 12) return `+${p.slice(0,3)} ${p.slice(3,6)} ${p.slice(6,9)} ${p.slice(9)}`;
                if (p.length === 10) return `0${p.slice(1,4)} ${p.slice(4,7)} ${p.slice(7)}`;
                return p;
            },
            'US': (p) => {
                if (p.length === 11) return `+${p[0]} (${p.slice(1,4)}) ${p.slice(4,7)}-${p.slice(7)}`;
                if (p.length === 10) return `(${p.slice(0,3)}) ${p.slice(3,6)}-${p.slice(6)}`;
                return p;
            },
            'GB': (p) => {
                if (p.length === 12) return `+${p.slice(0,2)} ${p.slice(2,5)} ${p.slice(5,8)} ${p.slice(8)}`;
                if (p.length === 11) return `0${p.slice(1,4)} ${p.slice(4,7)} ${p.slice(7)}`;
                return p;
            }
        };
        
        return (formats[country] || ((p) => p))(cleaned);
    },
    
    // Card number formatting (XXXX XXXX XXXX XXXX)
    cardNumber: (number) => {
        const cleaned = number.replace(/\D/g, '');
        return cleaned.replace(/(\d{4})/g, '$1 ').trim();
    },
    
    // Date formatting
    date: (date, format = 'short') => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (format === 'relative') {
            if (diff < 60000) return 'just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
            if (diff < 2592000000) return `${Math.floor(diff / 604800000)}w ago`;
            if (diff < 31536000000) return `${Math.floor(diff / 2592000000)}mo ago`;
            return `${Math.floor(diff / 31536000000)}y ago`;
        }
        
        if (format === 'short') {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        if (format === 'long') {
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // File size formatting
    fileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Percentage formatting
    percentage: (value, decimals = 1) => {
        return `${Number(value).toFixed(decimals)}%`;
    },
    
    // Truncate text
    truncate: (text, length = 50, suffix = '...') => {
        if (text.length <= length) return text;
        return text.substring(0, length) + suffix;
    }
};

// ===== STORAGE =====
const Storage = {
    set: (key, value) => {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        localStorage.removeItem(key);
    },
    
    clear: () => {
        localStorage.clear();
    },
    
    has: (key) => {
        return localStorage.getItem(key) !== null;
    }
};

// ===== COOKIES =====
const Cookies = {
    set: (name, value, days = 7) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
    },
    
    get: (name) => {
        const cookieName = `${name}=`;
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return null;
    },
    
    remove: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
};

// ===== URL PARAMETERS =====
const UrlParams = {
    get: (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },
    
    getAll: () => {
        return Object.fromEntries(new URLSearchParams(window.location.search));
    },
    
    set: (params) => {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        window.history.pushState({}, '', url);
    },
    
    remove: (name) => {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.pushState({}, '', url);
    },
    
    clear: () => {
        const url = new URL(window.location);
        url.search = '';
        window.history.pushState({}, '', url);
    }
};

// ===== DEVICE DETECTION =====
const Device = {
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    isIOS: () => {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    
    isAndroid: () => {
        return /Android/i.test(navigator.userAgent);
    },
    
    isDesktop: () => {
        return !Device.isMobile();
    },
    
    getOS: () => {
        const ua = navigator.userAgent;
        if (ua.indexOf('Win') !== -1) return 'Windows';
        if (ua.indexOf('Mac') !== -1) return 'MacOS';
        if (ua.indexOf('Linux') !== -1) return 'Linux';
        if (Device.isIOS()) return 'iOS';
        if (Device.isAndroid()) return 'Android';
        return 'Unknown';
    },
    
    getBrowser: () => {
        const ua = navigator.userAgent;
        if (ua.indexOf('Chrome') !== -1) return 'Chrome';
        if (ua.indexOf('Firefox') !== -1) return 'Firefox';
        if (ua.indexOf('Safari') !== -1) return 'Safari';
        if (ua.indexOf('Edge') !== -1) return 'Edge';
        if (ua.indexOf('Opera') !== -1) return 'Opera';
        return 'Unknown';
    },
    
    getScreenSize: () => {
        return {
            width: window.screen.width,
            height: window.screen.height
        };
    }
};

// ===== NETWORK =====
const Network = {
    isOnline: () => {
        return navigator.onLine;
    },
    
    onOnline: (callback) => {
        window.addEventListener('online', callback);
    },
    
    onOffline: (callback) => {
        window.addEventListener('offline', callback);
    },
    
    checkConnection: async () => {
        try {
            await fetch('https://www.google.com/favicon.ico', {
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch {
            return false;
        }
    },
    
    getConnectionType: () => {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                type: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }
};

// ===== COLOR UTILITIES =====
const Colors = {
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    rgbToHex: (r, g, b) => {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    lighten: (color, percent) => {
        const rgb = Colors.hexToRgb(color);
        if (!rgb) return color;
        
        rgb.r = Math.min(255, Math.floor(rgb.r * (1 + percent / 100)));
        rgb.g = Math.min(255, Math.floor(rgb.g * (1 + percent / 100)));
        rgb.b = Math.min(255, Math.floor(rgb.b * (1 + percent / 100)));
        
        return Colors.rgbToHex(rgb.r, rgb.g, rgb.b);
    },
    
    darken: (color, percent) => {
        const rgb = Colors.hexToRgb(color);
        if (!rgb) return color;
        
        rgb.r = Math.max(0, Math.floor(rgb.r * (1 - percent / 100)));
        rgb.g = Math.max(0, Math.floor(rgb.g * (1 - percent / 100)));
        rgb.b = Math.max(0, Math.floor(rgb.b * (1 - percent / 100)));
        
        return Colors.rgbToHex(rgb.r, rgb.g, rgb.b);
    },
    
    getContrastColor: (hex) => {
        const rgb = Colors.hexToRgb(hex);
        if (!rgb) return '#000000';
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }
};

// ===== MATH UTILITIES =====
const MathUtils = {
    round: (num, decimals = 2) => {
        return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
    },
    
    clamp: (num, min, max) => {
        return Math.min(Math.max(num, min), max);
    },
    
    random: (min, max) => {
        return Math.random() * (max - min) + min;
    },
    
    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// ===== EXPORTS =====
window.UnipayUtils = {
    Validators,
    Formatters,
    Storage,
    Cookies,
    UrlParams,
    Device,
    Network,
    Colors,
    MathUtils
};