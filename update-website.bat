@echo off
REM CryptoQuant 网站更新脚本 - Windows版本

echo 🚀 开始更新 CryptoQuant 交易对系统...

REM 检查当前分支
echo 📋 检查当前Git状态...
git status

REM 添加所有更改
echo 📁 添加更改到Git...
git add .

REM 获取当前时间
set CURRENT_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2% %time:~0,2%:%time:~3,2%:%time:~6,2%
set COMMIT_MSG=更新交易对系统 - %CURRENT_DATE%

REM 提交更改
echo 💾 提交更改: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

REM 推送到GitHub
echo 🔄 推送到GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo ✅ 推送完成！网站正在自动部署中...
    echo ⏱️  部署通常需要1-3分钟完成
    echo 🌐 请检查您的部署平台状态
) else (
    echo ❌ 推送失败，请检查错误信息
)

echo 🎉 更新流程完成！
pause