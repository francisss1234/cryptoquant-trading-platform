# CryptoQuant - 量化交易平台

一个功能完整的加密货币量化交易平台，支持实时数据监控、策略开发、风险管理和交易执行。

## 🚀 功能特性

### 📈 实时数据监控
- 实时价格更新
- K线图表展示
- 订单簿数据
- 交易记录监控

### 🔧 策略开发
- 可视化策略编辑器
- 历史数据回测
- 策略性能分析
- 实时信号推送

### 💰 交易功能
- 模拟交易执行
- 订单状态跟踪
- 风险管理工具
- 投资组合监控

### 📊 技术分析
- 专业技术指标
- 多时间周期分析
- 图表可视化
- 数据导出功能

## 🛠️ 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **状态管理**: Zustand
- **实时通信**: WebSocket
- **图表**: Recharts
- **UI组件**: 自定义组件

## 🚀 快速开始

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动后端API
npm run dev:api
```

### 生产部署
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 📁 项目结构

```
cryptoqs/
├── api/                    # 后端API
│   ├── routes/            # API路由
│   ├── services/          # 业务逻辑
│   └── config/            # 配置文件
├── src/                   # 前端代码
│   ├── components/        # React组件
│   ├── pages/            # 页面组件
│   ├── hooks/            # 自定义Hooks
│   └── utils/            # 工具函数
├── dist/                  # 构建输出
└── deployment-package/    # 部署包
```

## 🔧 API端点

### 健康检查
```
GET /api/health
```

### 市场价格
```
GET /api/market/price/:symbol
```

### 策略列表
```
GET /api/strategies
```

## 🌐 访问地址

- **本地访问**: http://localhost:3000
- **API测试**: http://localhost:3000/api/health
- **局域网访问**: http://your-ip:3000

## 📄 许可证

MIT License

## 🎉 功能亮点

✅ **实时数据流** - WebSocket实时更新  
✅ **策略回测** - 历史数据验证  
✅ **风险管理** - 专业风控工具  
✅ **响应式设计** - 移动端适配  
✅ **生产就绪** - 一键部署  

---

**🚀 开始您的量化交易之旅！**