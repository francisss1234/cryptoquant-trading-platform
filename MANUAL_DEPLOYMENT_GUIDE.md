# 🚀 手动部署到 Vercel 指南

由于 Vercel CLI 需要交互式认证，这里提供完整的手动部署步骤：

## 📦 部署包已准备就绪

### ✅ 已完成的工作
1. **项目构建成功** - 所有 TypeScript 错误已修复
2. **生产文件已生成** - dist/ 目录包含优化后的代码
3. **Vercel 配置完成** - vercel.json 已配置
4. **环境变量模板** - .env.production.template 已创建

## 🌐 方法一：Vercel 网站手动部署

### 步骤 1: 访问 Vercel 控制台
1. 打开浏览器访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub、GitLab 或邮箱登录
3. 点击 "New Project" 创建新项目

### 步骤 2: 上传项目文件
1. 选择 "Upload" 选项
2. 拖拽整个项目文件夹（cryptoqs）到上传区域
3. 或者使用 Git 仓库推送（推荐）

### 步骤 3: 配置项目设置
**构建配置：**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 步骤 4: 设置环境变量
在 Vercel 项目设置中添加以下环境变量：

```bash
# 必需的环境变量
NODE_ENV=production
JWT_SECRET=your-very-strong-jwt-secret-key-min-32-characters
CLIENT_URL=https://your-domain.vercel.app

# 可选：交易所 API 密钥
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
COINBASE_API_KEY=your_coinbase_api_key
COINBASE_SECRET_KEY=your_coinbase_secret_key
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSWORD=your_okx_password
```

### 步骤 5: 部署
点击 "Deploy" 按钮开始部署

## 📁 方法二：Git 仓库部署（推荐）

### 步骤 1: 创建 Git 仓库
```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "Initial CryptoQuant deployment"

# 推送到 GitHub
git remote add origin https://github.com/your-username/cryptoqs.git
git push -u origin main
```

### 步骤 2: 连接 Vercel
1. 登录 Vercel 控制台
2. 点击 "New Project"
3. 选择 "Import Git Repository"
4. 授权并选择你的 cryptoqs 仓库
5. 配置环境变量（同上）
6. 点击 "Deploy"

## 🔧 方法三：Vercel CLI 认证后部署

如果你可以完成 Vercel CLI 认证：

### 步骤 1: 认证登录
```bash
vercel login
# 按照提示完成认证
```

### 步骤 2: 初始化项目
```bash
vercel
# 选择项目名称和设置
```

### 步骤 3: 设置环境变量
```bash
vercel env add NODE_ENV production
vercel env add JWT_SECRET your-very-strong-jwt-secret-key
vercel env add CLIENT_URL https://your-domain.vercel.app
```

### 步骤 4: 生产部署
```bash
vercel --prod
```

## ✅ 部署验证清单

部署完成后，请验证以下功能：

### 🌐 基础功能
- [ ] 网站可以正常访问
- [ ] 所有页面加载正常
- [ ] 没有 JavaScript 错误

### 📊 实时数据
- [ ] WebSocket 连接成功
- [ ] 价格数据实时更新
- [ ] K线图表正常显示
- [ ] 订单簿数据正确

### 🔒 用户功能
- [ ] 用户注册/登录正常
- [ ] 策略创建和保存
- [ ] 回测功能运行
- [ ] 策略信号推送

### 📱 移动端
- [ ] 响应式设计正常
- [ ] 移动端界面适配
- [ ] 触摸交互正常

## 🔍 常见问题解决

### 构建失败
```bash
# 清理缓存重新构建
rm -rf node_modules package-lock.json
npm install
npm run build
```

### WebSocket 连接失败
1. 检查环境变量 `CLIENT_URL` 是否正确
2. 确认 WebSocket 服务在 Vercel Functions 中启用
3. 检查浏览器控制台错误信息

### 数据库连接失败
- 当前使用内存数据库，无需额外配置
- 生产环境建议升级到 PostgreSQL

## 📞 获取帮助

如果遇到问题：
1. 检查 Vercel 构建日志
2. 查看浏览器控制台错误
3. 验证环境变量配置
4. 参考 DEPLOYMENT_GUIDE.md 详细文档

## 🎉 部署成功！

恭喜！您的 CryptoQuant 量化交易平台即将上线！

**预计部署时间：2-5 分钟**
**预计访问地址：https://your-project-name.vercel.app**

开始您的量化交易之旅吧！🚀💰📈