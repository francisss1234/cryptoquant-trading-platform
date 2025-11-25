@echo off
echo 🚀 CryptoQuant 一键本地部署启动器
echo =================================
echo.
echo 📦 正在启动本地生产服务器...
echo.
REM 安装必要的依赖
echo 📥 安装依赖...
cd /d "%~dp0"
if not exist "node_modules\express" (
    npm install express cors --save
)

REM 启动生产服务器
echo 🎯 启动服务器...
echo.
echo 🌐 访问地址：
echo    http://localhost:3000
echo    http://127.0.0.1:3000
echo    http://你的IP:3000
echo.
echo 🔧 API测试地址：
echo    http://localhost:3000/api/health
echo    http://localhost:3000/api/market/price/BTC/USDT
echo    http://localhost:3000/api/strategies
echo.
echo 💡 局域网访问：
echo    让手机/其他设备访问你的IP:3000
echo.
echo 🛑 按 Ctrl+C 停止服务器
echo.

REM 启动服务器
node api/production-server.js

pause