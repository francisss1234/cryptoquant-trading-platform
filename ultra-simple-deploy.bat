@echo off
echo 🚀 CryptoQuant Ultra-Simple Deploy
echo ===================================
echo.

REM Build the project
echo 📦 Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Create deploy folder
echo 📁 Preparing deployment...
if exist deploy rd /s /q deploy
mkdir deploy
xcopy /s /e /y dist deploy\dist\
copy /y vercel-ultra-simple.json deploy\vercel.json

echo ✅ Ready for deployment!
echo.
echo 🌐 Next steps:
echo 1. Visit: https://vercel.com/new
echo 2. Drag and drop the 'deploy' folder
echo 3. Click "Deploy" button
echo.
echo 🎯 Alternative: Use Vercel CLI
echo npm install -g vercel
echo cd deploy && vercel --prod
echo.
pause