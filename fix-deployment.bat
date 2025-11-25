@echo off
echo 🔧 CryptoQuant Vercel Deployment Fix
echo ====================================

REM Step 1: Clean build
echo 🧹 Step 1: Cleaning build artifacts...
if exist "dist" rmdir /s /q dist
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
if exist ".vercel" rmdir /s /q .vercel

REM Step 2: Reinstall dependencies
echo 📦 Step 2: Installing dependencies...
call npm install

REM Step 3: Rebuild project
echo 🔨 Step 3: Building project...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors first.
    pause
    exit /b 1
)

REM Step 4: Create production environment file
if not exist ".env.production" (
    echo ⚙️ Step 4: Creating production environment file...
    copy .env.production.template .env.production
    echo 📝 Please update .env.production with your production values
)

REM Step 5: Clean Vercel cache
echo 🗑️ Step 5: Cleaning Vercel cache...
if exist ".vercel" rmdir /s /q .vercel

echo ✅ Fix preparation complete!
echo 🚀 Ready for deployment!
echo.
echo 📋 Next steps:
echo    1. Run: vercelecho    2. Follow the prompts to set up your project
echo    3. Configure environment variables in Vercel dashboard
echo    4. Deploy to production
echo.
echo 🔧 If deployment still fails, try:
echo    - Using Vercel website manual upload
echo    - Checking environment variables
echo    - Verifying API routes work locally
echo.

echo Would you like to start the deployment now? (y/n)
set /p response=Deploy now? 
if /i "%response%"=="y" (
    echo Starting Vercel deployment...
    vercel
) else (
    echo You can deploy later by running: vercel
)

pause