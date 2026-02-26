class Validators {
    // Email validation
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Phone validation by country
    static isValidPhone(phone, country = 'KE') {
        const patterns = {
            'KE': /^(\+254|0)[17]\d{8}$/,
            'US': /^(\+1|1)?\d{10}$/,
            'GB': /^(\+44|0)\d{10}$/,
            'NG': /^(\+234|0)\d{10}$/,
            'IN': /^(\+91|0)?[6-9]\d{9}$/,
            'AE': /^(\+971|0)?[5]\d{8}$/,
            'SA': /^(\+966|0)?[5]\d{8}$/,
            'default': /^\+?\d{10,15}$/
        };
        return (patterns[country] || patterns.default).test(phone);
    }

    // Password validation
    static isValidPassword(password) {
        return password.length >= 6;
    }

    // Password strength checker
    static checkPasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        if (checks.length) score++;
        if (checks.hasUpper) score++;
        if (checks.hasLower) score++;
        if (checks.hasNumber) score++;
        if (checks.hasSpecial) score++;

        return {
            score,
            strength: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong',
            checks
        };
    }

    // Amount validation
    static isValidAmount(amount, min = 1, max = 1000000) {
        const num = parseFloat(amount);
        return !isNaN(num) && num >= min && num <= max;
    }

    // IBAN validation
    static isValidIBAN(iban) {
        const re = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
        return re.test(iban.replace(/\s/g, '').toUpperCase());
    }

    // SWIFT/BIC validation
    static isValidSWIFT(swift) {
        const re = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        return re.test(swift.toUpperCase());
    }

    // Credit card validation (Luhn algorithm)
    static isValidCardNumber(number) {
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
    }

    // CVV validation
    static isValidCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }

    // Expiry date validation
    static isValidExpiry(expiry) {
        const re = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!re.test(expiry)) return false;

        const [month, year] = expiry.split('/');
        const now = new Date();
        const expYear = 2000 + parseInt(year);
        const expMonth = parseInt(month);

        return expYear > now.getFullYear() || 
               (expYear === now.getFullYear() && expMonth >= now.getMonth() + 1);
    }
}

module.exports = Validators;
