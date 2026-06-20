#!/bin/bash
# Deploy to Railway - Interactive setup script

set -e

echo "🚀 C3113 Audio Converter — Railway Deployment Setup"
echo ""
echo "This script helps you deploy to Railway in 3 steps:"
echo "1. Install Railway CLI"
echo "2. Link to Railway project"
echo "3. Deploy services"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    curl -fsSL https://raw.githubusercontent.com/railwayapp/cli/main/install.sh | bash
    export PATH="$PATH:$HOME/.railway/bin"
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "📋 Step 1: Log in to Railway"
echo "Run this command and authenticate with GitHub:"
echo ""
echo "  railway login"
echo ""
read -p "Press Enter once you've logged in..."

echo ""
echo "📋 Step 2: Create or link to Railway project"
echo "Choose one:"
echo "  A) Create new project: railway init"
echo "  B) Link existing project: railway link"
echo ""
read -p "Enter your choice (A/B): " choice

if [[ "$choice" == "A" || "$choice" == "a" ]]; then
    railway init
elif [[ "$choice" == "B" || "$choice" == "b" ]]; then
    railway link
else
    echo "Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "📋 Step 3: Deploy"
echo "Deploying docker-compose.yml to Railway..."
echo ""

# Deploy using Railway CLI with docker-compose
railway up --service backend --service worker --service redis

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. View your app: railway dashboard"
echo "2. Check logs: railway logs"
echo "3. Get API URL: railway env"
echo ""
echo "Your API is now live! 🎉"
