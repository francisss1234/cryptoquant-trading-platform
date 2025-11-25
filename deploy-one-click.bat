@echo off
echo 🎯 CryptoQuant 一键部署启动器
echo =================================
echo.
echo 📦 正在准备部署包...
echo.

REM 打开Vercel直接上传页面
echo 🌐 正在打开 Vercel 部署页面...
start https://vercel.com/new/upload

REM 打开部署包文件夹
echo 📁 正在打开部署包文件夹...
explorer "%~dp0deployment-package"

echo.
echo ✅ 准备完成！请按以下步骤操作：
echo.
echo 📝 部署步骤：
echo 1. 在Vercel页面点击"选择文件"或拖拽文件夹
echo 2. 选择 deployment-package 文件夹
echo 3. 点击 "Deploy" 按钮
echo 4. 等待2-4分钟完成部署
echo.
echo 🔧 环境变量配置（部署后）：
echo NODE_ENV=production
echo CLIENT_URL=https://your-project-name.vercel.app
echo JWT_SECRET=cryptoquant-secure-jwt-secret-key-2025-min-32-chars
echo.
echo 🎯 预计时间：3-5分钟
echo 📈 成功率：95%%+
echo.
echo 💰 开始您的量化交易之旅吧！
echo.
pause