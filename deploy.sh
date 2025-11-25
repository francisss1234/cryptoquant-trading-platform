#!/bin/bash

# CryptoQuant Production Deployment Script
# This script helps deploy the CryptoQuant platform to Vercel

echo "🚀 Starting CryptoQuant Production Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production file not found. Please create it from .env.production.template"
    echo "   cp .env.production.template .env.production"
    echo "   Then update the values with your production settings."
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "Please follow the prompts to complete the deployment."
echo ""
echo "📋 Deployment Checklist:"
echo "   1. Login to Vercel if prompted"
echo "   2. Select or create a project"
echo "   3. Configure environment variables in Vercel dashboard"
echo "   4. Deploy to production"
echo ""

vercel --prod

echo ""
echo "🎉 Deployment process initiated!"
echo "📊 After deployment, verify the following:"
echo "   ✅ WebSocket connections work"
echo "   ✅ Real-time data streaming"
echo "   ✅ Strategy signals are received"
echo "   ✅ All API endpoints respond correctly"
echo ""
echo "📚 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md"
echo "🚀 Happy trading with CryptoQuant!"