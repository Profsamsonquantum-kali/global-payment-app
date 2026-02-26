#!/bin/bash

echo "🔍 TESTING GLOBAL PAYMENT APP"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd backend

# Step 1: Test if server starts
echo -e "${YELLOW}Step 1: Testing server start...${NC}"
node -e "
const app = require('./server');
console.log('✅ Server module loaded');
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server module loads correctly${NC}"
else
    echo -e "${RED}❌ Server module has errors${NC}"
fi

# Step 2: Check for duplicate declarations
echo -e "${YELLOW}Step 2: Checking for duplicate declarations...${NC}"
DUPLICATES=$(grep -c "^const users =" server.js)
if [ "$DUPLICATES" -eq 1 ]; then
    echo -e "${GREEN}✅ users declared once${NC}"
else
    echo -e "${RED}❌ users declared $DUPLICATES times${NC}"
fi

# Step 3: Check all routes exist
echo -e "${YELLOW}Step 3: Checking routes...${NC}"
ROUTES=(
    "app.post('/api/auth/register'"
    "app.post('/api/auth/login'"
    "app.post('/api/auth/google'"
    "app.get('/api/users/profile'"
    "app.get('/api/payments/transactions'"
    "app.post('/api/payments/send'"
    "app.get('/api/global/countries'"
    "app.get('/api/global/exchange-rate'"
)

for route in "${ROUTES[@]}"; do
    if grep -q "$route" server.js; then
        echo -e "${GREEN}✅ Found: $route${NC}"
    else
        echo -e "${RED}❌ Missing: $route${NC}"
    fi
done

# Step 4: Check frontend files
echo -e "${YELLOW}Step 4: Checking frontend files...${NC}"
cd ../frontend

FRONTEND_FILES=(
    "index.html"
    "login.html"
    "register.html"
    "profile.html"
    "send.html"
    "global-send.html"
    "transactions.html"
    "style.css"
    "script.js"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ TEST COMPLETE${NC}"
echo ""
echo "To start the app locally:"
echo "  cd backend && npm run dev"
echo "  cd frontend && npm start"
echo ""
echo "Or deploy to Render:"
echo "  git add ."
echo "  git commit -m 'Fully functional app'"
echo "  git push origin main"
echo ""
echo "Your live app will be at: https://global-payment-app.onrender.com"
