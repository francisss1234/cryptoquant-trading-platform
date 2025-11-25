#!/bin/bash

# CryptoQuant Vercel Deployment Fix Script
# This script helps fix common Vercel deployment issues

echo "🔧 CryptoQuant Vercel Deployment Fix"
echo "===================================="

# Step 1: Clean build
echo "🧹 Step 1: Cleaning build artifacts..."
rm -rf dist node_modules package-lock.json .vercel

# Step 2: Reinstall dependencies
echo "📦 Step 2: Installing dependencies..."
npm install

# Step 3: Rebuild project
echo "🔨 Step 3: Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors first."
    exit 1
fi

# Step 4: Create production environment file
if [ ! -f ".env.production" ]; then
    echo "⚙️ Step 4: Creating production environment file..."
    cp .env.production.template .env.production
    echo "📝 Please update .env.production with your production values"
fi

# Step 5: Clean Vercel cache
echo "🗑️ Step 5: Cleaning Vercel cache..."
rm -rf .vercel

# Step 6: Deploy to Vercel
echo "🚀 Step 6: Deploying to Vercel..."
echo ""
echo "📋 Next steps:"
echo "   1. Run: vercel"
echo "   2. Follow the prompts to set up your project"
echo "   3. Configure environment variables in Vercel dashboard"
echo "   4. Deploy to production"
echo ""
echo "🔧 If deployment still fails, try:"
echo "   - Using Vercel website manual upload"
echo "   - Checking environment variables"
echo "   - Verifying API routes work locally"
echo ""

echo "✅ Fix preparation complete!"
echo "🚀 Ready for deployment!

# Optional: Start deployment process
echo "Would you like to start the deployment now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Starting Vercel deployment..."
    vercel
else
    echo "You can deploy later by running: vercel"
fi