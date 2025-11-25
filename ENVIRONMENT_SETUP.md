# 🚀 CryptoQuant 环境变量配置指南

## 📋 部署前配置

### 必需环境变量

```bash
# 基础配置
NODE_ENV=production
CLIENT_URL=https://your-project-name.vercel.app
JWT_SECRET=your-very-strong-jwt-secret-key-min-32-characters

# 可选配置（用于高级功能）
# BINANCE_API_KEY=your-binance-api-key
# BINANCE_SECRET=your-binance-secret
# OKX_API_KEY=your-okx-api-key
# OKX_SECRET=your-okx-secret
# OKX_PASSPHRASE=your-okx-passphrase
```

### 📝 配置步骤

1. **访问 Vercel 项目设置**
   - 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 选择您的 CryptoQuant 项目
   - 点击 "Settings" 选项卡

2. **添加环境变量**
   - 点击 "Environment Variables"
   - 添加上述所有必需变量
   - 确保 JWT_SECRET 至少 32 个字符

3. **保存并重新部署**
   - 点击 "Save"
   - 触发重新部署以应用新配置

### 🔒 安全建议

- 使用强密码生成器创建 JWT_SECRET
- 不要在代码中硬编码任何密钥
- 定期更新 API 密钥和密钥
- 使用 Vercel 的内置环境变量管理功能

### ✅ 验证配置

部署完成后，测试以下端点：

```bash
# 健康检查
curl https://your-domain.vercel.app/api/health

# 市场价格
curl https://your-domain.vercel.app/api/market/price/BTC/USDT

# 策略列表
curl https://your-domain.vercel.app/api/strategies
```

预期所有端点都返回 200 状态码和 JSON 数据。