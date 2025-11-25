@echo off
echo 🚀 Starting CryptoQuant Production Deployment...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project
echo 🔨 Building the project...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors and try again.
    exit /b 1
)

echo ✅ Build completed successfully!

REM Check if .env.production exists
if not exist ".env.production" (
    echo ⚠️  .env.production file not found. Please create it from .env.production.template
    echo    copy .env.production.template .env.production
    echo    Then update the values with your production settings.
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
echo Please follow the prompts to complete the deployment.
echo.
echo 📋 Deployment Checklist:
echo    1. Login to Vercel if prompted
echo    2. Select or create a project
echo    3. Configure environment variables in Vercel dashboard
echo    4. Deploy to production
echo.

vercel --prod

echo.
echo 🎉 Deployment process initiated!
echo 📊 After deployment, verify the following:
echo    ✅ WebSocket connections work
echo    ✅ Real-time data streaming
echo    ✅ Strategy signals are received
echo    ✅ All API endpoints respond correctly
echo.
echo 📚 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md
echo 🚀 Happy trading with CryptoQuant!

pause