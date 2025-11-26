@echo off
echo 🚀 CryptoQuant Trading Platform - Automated Vercel Deploy
echo.

:: Install Vercel CLI if not exists
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

echo 🔧 Preparing deployment configuration...
copy /Y vercel-simple.json vercel.json

echo 🌐 Starting Vercel deployment...
echo Note: This will require authentication in your browser.
echo.

:: Use echo to pipe 'Y' to vercel command
echo Y | vercel --prod

echo.
echo ✅ Deployment process initiated!
echo Please check the deployment URL in the output above.
pause