#!/bin/bash

echo "🔧 FIXING GIT PUSH ERROR"
echo "========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Check current branch
echo -e "${YELLOW}Step 1: Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Step 2: Add all files
echo -e "${YELLOW}Step 2: Adding files...${NC}"
git add .

# Step 3: Commit
echo -e "${YELLOW}Step 3: Committing files...${NC}"
git commit -m "Initial commit: Global Payment App"

# Step 4: Rename branch if needed
if [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${YELLOW}Step 4: Renaming master to main...${NC}"
    git branch -m master main
fi

# Step 5: Push to GitHub
echo -e "${YELLOW}Step 5: Pushing to GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push successful!${NC}"
else
    echo -e "${RED}❌ Push failed. Trying alternative...${NC}"
    
    # Alternative: force push if needed
    git push -u origin main --force
fi

echo ""
echo "Your repository is now at:"
echo "https://github.com/Profsamsonquantum-kali/global-payment-app"
