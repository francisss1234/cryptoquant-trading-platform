# CryptoQuant 量化交易平台 - 部署指南

## 🚀 项目概述

CryptoQuant 是一个功能完整的量化交易平台，集成了：
- ✅ WebSocket 实时数据流（价格、K线、订单簿、交易记录）
- ✅ 策略开发与回测
- ✅ 交易执行与风险管理
- ✅ 数据可视化与分析
- ✅ 多交易所支持（Binance、OKX、Coinbase）

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+ 
- npm 或 pnpm
- Vercel CLI（用于部署）

### 2. 环境变量配置
复制 `.env.example` 到 `.env` 并配置：

```bash
# 数据库配置（生产环境建议使用 PostgreSQL）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoquant
DB_USER=postgres
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 交易所 API 密钥（可选，用于实盘交易）
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
COINBASE_API_KEY=your_coinbase_api_key
COINBASE_SECRET_KEY=your_coinbase_secret_key
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSWORD=your_okx_password

# 服务器配置
PORT=3003
NODE_ENV=production
CLIENT_URL=https://your-domain.vercel.app

# 频率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Vercel 部署步骤

### 步骤 1: 安装 Vercel CLI
```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel
```bash
vercel login
```

### 步骤 3: 初始化项目
```bash
vercel
```

按照提示完成：
1. 选择项目名称（建议使用 cryptoquant）
2. 选择部署目录（当前目录）
3. 覆盖默认构建设置：
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 步骤 4: 配置环境变量
在 Vercel 控制台或 CLI 中设置环境变量：

```bash
# 设置环境变量
vercel env add NODE_ENV production
vercel env add JWT_SECRET your_jwt_secret_key
vercel env add CLIENT_URL https://your-domain.vercel.app

# 可选：添加交易所 API 密钥
vercel env add BINANCE_API_KEY your_binance_api_key
vercel env add BINANCE_SECRET_KEY your_binance_secret_key
```

### 步骤 5: 重新部署
```bash
vercel --prod
```

## 🔧 生产环境配置

### 1. WebSocket 配置
WebSocket 服务已配置为支持 Vercel Serverless 函数：
- 入口文件: `api/vercel.ts`
- 支持实时数据流和客户端连接
- 自动重连机制

### 2. 数据库配置
当前使用内存数据库（MockDatabase），适合演示和测试。生产环境建议：

#### PostgreSQL 配置
```bash
# 创建数据库
createdb cryptoquant

# 运行迁移（如果有）
npm run migrate
```

#### 更新数据库连接
修改 `api/config/database.ts` 使用真实 PostgreSQL 连接：

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 3. 性能优化

#### 前端优化
- ✅ 代码分割和懒加载
- ✅ 图片优化和压缩
- ✅ CDN 缓存配置
- ✅ 响应式设计

#### 后端优化
- ✅ API 响应缓存
- ✅ 数据库查询优化
- ✅ WebSocket 连接池管理
- ✅ 错误处理和重试机制

## 📊 功能验证

部署完成后，访问应用并验证以下功能：

### 1. 实时数据流
- ✅ 价格实时更新
- ✅ K线图表自动刷新
- ✅ 订单簿实时显示
- ✅ 交易记录实时推送

### 2. 策略功能
- ✅ 策略创建和编辑
- ✅ 回测功能正常运行
- ✅ 策略信号实时推送
- ✅ 性能报告生成

### 3. 交易功能
- ✅ 模拟交易执行
- ✅ 订单状态跟踪
- ✅ 风险管理功能
- ✅ 投资组合监控

## 🔍 监控和调试

### 1. 日志查看
```bash
# Vercel 函数日志
vercel logs

# 实时日志
vercel logs --follow
```

### 2. 性能监控
- 使用 Vercel Analytics 监控性能
- 设置错误警报
- 监控 WebSocket 连接状态

### 3. 常见问题

#### WebSocket 连接失败
- 检查环境变量 `CLIENT_URL` 是否正确
- 验证 WebSocket 服务是否启动
- 检查网络防火墙设置

#### 数据库连接失败
- 验证数据库凭据
- 检查数据库服务器状态
- 确认网络连接

#### 构建失败
- 检查 Node.js 版本兼容性
- 验证依赖包版本
- 清理缓存重新构建

## 🔒 安全建议

### 1. API 密钥安全
- 使用 Vercel 环境变量存储敏感信息
- 定期轮换 API 密钥
- 限制 API 密钥权限

### 2. 数据安全
- 启用 HTTPS（Vercel 自动提供）
- 实施数据加密
- 定期备份数据库

### 3. 访问控制
- 实施用户认证
- 设置 API 访问限制
- 监控异常访问模式

## 📞 技术支持

如果遇到问题：
1. 检查 Vercel 控制台错误日志
2. 验证环境变量配置
3. 确认构建和部署状态
4. 查看 WebSocket 连接状态

## 🎉 部署完成

恭喜！您的 CryptoQuant 量化交易平台已成功部署到生产环境。现在您可以：

- 🚀 访问实时市场数据
- 📈 创建和测试交易策略
- 💰 执行模拟交易
- 📊 分析交易绩效
- 🔔 接收实时策略信号

开始您的量化交易之旅吧！