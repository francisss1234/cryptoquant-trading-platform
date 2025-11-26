# 🚀 CryptoQuant 自动部署指南

## 一键自动部署到 Vercel

### 方法 1: 使用 Vercel 网站（推荐）

1. **打开 Vercel 部署页面**
   访问: https://vercel.com/new

2. **导入 Git 仓库**
   - 点击 "Import Git Repository"
   - 选择你的 GitHub 仓库（cryptoquant-trading-platform）
   - 如果没有看到仓库，点击 "Add GitHub Account"

3. **配置项目**
   - 项目名称: cryptoquant-trading-platform
   - 框架预设: Vite
   - 构建命令: `npm run build`
   - 输出目录: `dist`

4. **环境变量（可选）**
   如果需要，可以添加这些环境变量：
   ```
   NODE_ENV=production
   VITE_API_URL=https://your-api-url.com
   ```

5. **点击 Deploy**
   Vercel 将自动构建和部署你的应用

### 方法 2: 使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel --prod
   ```

4. **按照提示完成部署**

### 方法 3: GitHub Actions 自动部署

1. **创建 GitHub Secrets**
   - 打开你的 GitHub 仓库
   - 进入 Settings → Secrets and variables → Actions
   - 添加以下 secrets：
     - `VERCEL_TOKEN`: 你的 Vercel API Token
     - `VERCEL_ORG_ID`: 你的 Vercel 组织 ID
     - `VERCEL_PROJECT_ID`: 你的 Vercel 项目 ID

2. **获取 Vercel Token**
   - 访问: https://vercel.com/account/tokens
   - 创建新的 Token

3. **获取组织 ID 和项目 ID**
   - 运行: `vercel ls`
   - 复制相应的 ID

## 🎯 部署后检查清单

部署成功后，请检查以下功能：

- ✅ 主页是否正常加载
- ✅ 实时数据流是否工作
- ✅ WebSocket 连接是否稳定
- ✅ 图表和指标是否显示
- ✅ 移动端响应是否正常

## 🔧 故障排除

### 常见问题和解决方案

1. **构建失败**
   - 检查 `npm run build` 是否在本地成功
   - 确认所有依赖项都已安装
   - 检查 TypeScript 编译错误

2. **WebSocket 连接问题**
   - 确认后端服务正在运行
   - 检查网络连接和防火墙设置
   - 验证 WebSocket URL 配置

3. **环境变量问题**
   - 确认所有必需的环境变量都已设置
   - 检查变量名是否正确
   - 验证变量值是否有效

## 📞 支持

如果遇到问题，请检查：
- 部署日志和错误信息
- 浏览器控制台日志
- 网络请求状态

## 🎉 恭喜！

部署成功后，你的 CryptoQuant 量化交易平台就可以通过 Vercel 提供的 URL 访问了。平台包含：

- 📊 实时市场数据监控
- 📈 技术分析图表
- 🤖 量化交易策略
- ⚠️ 风险管理工具
- 📱 响应式设计

享受你的量化交易之旅！