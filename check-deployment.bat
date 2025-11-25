@echo off
echo 🔍 CryptoQuant Deployment Status Check
echo ======================================

REM Check if deployment URL is provided
if "%~1"=="" (
    echo Usage: check-deployment.bat ^<your-deployment-url^>
    echo Example: check-deployment.bat https://cryptoquant.vercel.app
    exit /b 1
)

set "DEPLOYMENT_URL=%~1"
set "API_URL=%~1/api"

echo Checking deployment at: %DEPLOYMENT_URL%
echo.

REM Function to check endpoint would be implemented here
echo 1. 🔧 Basic Connectivity
echo ------------------------

REM Check main website
echo Checking Main Website...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%DEPLOYMENT_URL%' -UseBasicParsing; if ($response.StatusCode -eq 200) { echo ✅ SUCCESS (HTTP $($response.StatusCode)) } else { echo ❌ FAILED (HTTP $($response.StatusCode)) } } catch { echo ❌ CONNECTION FAILED }"

REM Check API health
echo Checking API Health Check...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/health' -UseBasicParsing; if ($response.StatusCode -eq 200) { echo ✅ SUCCESS (HTTP $($response.StatusCode)) } else { echo ❌ FAILED (HTTP $($response.StatusCode)) } } catch { echo ❌ CONNECTION FAILED }"

echo.
echo 2. 📊 API Functionality
echo -----------------------

REM Check market price API
echo Checking Market Price API...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/market/price/BTC/USDT' -UseBasicParsing; if ($response.StatusCode -eq 200) { echo ✅ SUCCESS } else { echo ❌ FAILED } } catch { echo ❌ FAILED }"

REM Check strategies API
echo Checking Strategies API...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/strategies' -UseBasicParsing; if ($response.StatusCode -eq 200) { echo ✅ SUCCESS } else { echo ❌ FAILED } } catch { echo ❌ FAILED }"

echo.
echo 3. 🎯 Overall Status
echo -------------------
echo Deployment check completed!
echo.
echo 📞 If you need help:
echo    1. Check Vercel console logs
echo    2. Verify environment variables
echo    3. Review deployment configuration
echo    4. Test locally first
echo.
echo 🎉 Check your platform at: %DEPLOYMENT_URL%
pause