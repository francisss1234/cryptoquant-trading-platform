#!/bin/bash

# CryptoQuant 网站更新脚本
# 用于通过GitHub自动部署更新

echo "🚀 开始更新 CryptoQuant 交易对系统..."

# 检查当前分支
echo "📋 检查当前Git状态..."
git status

# 添加所有更改
echo "📁 添加更改到Git..."
git add .

# 提交更改（使用当前时间作为提交信息）
COMMIT_MSG="更新交易对系统 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 提交更改: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# 推送到GitHub
echo "🔄 推送到GitHub..."
git push origin main

echo "✅ 推送完成！网站正在自动部署中..."
echo "⏱️  部署通常需要1-3分钟完成"
echo "🌐 请检查您的部署平台状态"

# 可选：打开部署平台页面
# 根据您的平台选择相应的命令

# 对于Vercel部署
if command -v vercel &> /dev/null; then
    echo "🔍 检查Vercel部署状态..."
    vercel --prod
fi

echo "🎉 更新流程完成！"