#!/bin/bash

# CryptoQuant Trading Platform - Final Deployment Script
# This script handles the complete deployment process

echo "🚀 CryptoQuant Trading Platform - Final Deployment"
echo "================================================="
echo

# Step 1: Build the application
echo "📦 Step 1: Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully!"
echo

# Step 2: Create deployment package
echo "📁 Step 2: Creating deployment package..."
mkdir -p deployment-final
cp -r dist deployment-final/
cp vercel-simple.json deployment-final/vercel.json
cp package.json deployment-final/
cp -r public deployment-final/ 2>/dev/null || true

echo "✅ Deployment package created!"
echo

# Step 3: Provide deployment instructions
echo "🌐 Step 3: Deploy to Vercel"
echo "Choose one of the following methods:"
echo
echo "Method 1 - Vercel Website (Recommended):"
echo "  1. Visit: https://vercel.com/new"
echo "  2. Drag and drop the 'deployment-final' folder"
echo "  3. Follow the prompts to complete deployment"
echo
echo "Method 2 - Vercel CLI:"
echo "  1. Install Vercel CLI: npm install -g vercel"
echo "  2. Login: vercel login"
echo "  3. Deploy: cd deployment-final && vercel --prod"
echo
echo "Method 3 - GitHub Integration:"
echo "  1. Push code to GitHub"
echo "  2. Connect repository to Vercel"
echo "  3. Automatic deployment on push"
echo

# Step 4: Create GitHub repository instructions
echo "📤 Step 4: Push to GitHub (Optional)"
echo "If you want to use GitHub integration:"
echo "  1. Create repository on GitHub: https://github.com/new"
echo "  2. Name it: cryptoquant-trading-platform"
echo "  3. Run these commands:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/cryptoquant-trading-platform.git"
echo "     git push -u origin master"
echo

# Step 5: Local testing
echo "🧪 Step 5: Local Testing"
echo "To test locally before deployment:"
echo "  npm install -g serve"
echo "  serve deployment-final/dist -p 3000"
echo "  Open: http://localhost:3000"
echo

echo "🎉 Deployment preparation complete!"
echo "Your application is ready for deployment."
echo
echo "📋 Summary:"
echo "  - Build: ✅ Complete"
echo "  - Package: ✅ Ready"
echo "  - Deployment: Ready to proceed"
echo
echo "Next steps:"
echo "  1. Choose your deployment method above"
echo "  2. Follow the instructions"
echo "  3. Enjoy your live CryptoQuant platform!"
echo