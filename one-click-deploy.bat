@echo off
echo 🚀 CryptoQuant Trading Platform - One-Click Deploy
echo.
echo This script will deploy your application to Vercel
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

:: Install Vercel CLI if not exists
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo 🔧 Building the application...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

echo 🌐 Deploying to Vercel...
echo This will open your browser for authentication if needed...
echo.

:: Use the simple configuration for deployment
copy vercel-simple.json vercel.json

:: Deploy to Vercel
vercel --prod

:: Restore original configuration if needed
copy vercel.json vercel-simple.json

echo.
echo ✅ Deployment process completed!
echo Check the URL provided by Vercel to see your live application.
pause