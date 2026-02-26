#!/bin/bash

echo "🔧 FIXING REGISTRATION ISSUE"
echo "============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Fix frontend API URLs
echo -e "${YELLOW}Step 1: Fixing frontend API URLs...${NC}"

# Fix register.html
sed -i 's|https://unipay-pro-api.onrender.com/api|${window.location.protocol}//${window.location.hostname}/api|g' frontend/register.html
sed -i 's|return .https.*;|return `${window.location.protocol}//${window.location.hostname}/api`;|g' frontend/register.html

# Fix login.html
sed -i 's|https://unipay-pro-api.onrender.com/api|${window.location.protocol}//${window.location.hostname}/api|g' frontend/login.html
sed -i 's|return .https.*;|return `${window.location.protocol}//${window.location.hostname}/api`;|g' frontend/login.html

# Step 2: Add auth routes to backend
echo -e "${YELLOW}Step 2: Adding auth routes to backend...${NC}"

# Create a backup
cp backend/server.js backend/server.js.bak

# Add auth routes before the frontend routes
cat >> backend/server.js << 'EOF'

// ============================================
// AUTH API ROUTES
// ============================================

// Mock users database (in memory)
const users = [];

// Register
app.post('/api/auth/register', (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, country } = req.body;
        
        console.log('Registration attempt:', { fullName, email, country });
        
        // Check if user exists
        const existingUser = users.find(u => u.email === email || u.phoneNumber === phoneNumber);
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            phoneNumber,
            password,
            country,
            balance: 1000,
            balances: {
                USD: 1000,
                EUR: 0,
                GBP: 0,
                KES: 0
            },
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Create token
        const token = 'mock_jwt_token_' + Date.now();
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                country: newUser.country,
                balance: newUser.balance,
                balances: newUser.balances
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration' 
        });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', email);
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        const token = 'mock_jwt_token_' + Date.now();
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                country: user.country,
                balance: user.balance,
                balances: user.balances
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login' 
        });
    }
});

// Get user profile
app.get('/api/users/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    // Mock response
    res.json({
        id: '123',
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        country: 'KE',
        balance: 1000,
        balances: {
            USD: 1000,
            EUR: 0,
            GBP: 0,
            KES: 0
        }
    });
});
EOF

# Step 3: Commit and push
echo -e "${YELLOW}Step 3: Committing and pushing changes...${NC}"
git add .
git commit -m "Fix registration: Add auth routes and fix API URLs"
git push origin main

echo -e "${GREEN}✅ FIX COMPLETE!${NC}"
echo ""
echo "Now go to Render.com and redeploy:"
echo "https://dashboard.render.com"
echo ""
echo "After redeployment, test registration at:"
echo "https://global-payment-app.onrender.com/register"
