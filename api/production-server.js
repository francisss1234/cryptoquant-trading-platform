/**
 * 🚀 CryptoQuant 本地生产服务器
 * 无需外部依赖，一键启动生产环境
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// API路由 - 必须在静态文件之前定义
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CryptoQuant Production Server',
    version: '1.0.0',
    environment: 'production'
  });
});

app.get('/api/market/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  const price = Math.random() * 50000 + 1000;
  res.json({
    symbol,
    price: parseFloat(price.toFixed(2)),
    timestamp: Date.now(),
    change: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
    changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2))
  });
});

app.get('/api/strategies', (req, res) => {
  res.json({
    strategies: [
      { 
        id: 1, 
        name: 'MA Crossover', 
        status: 'active',
        description: 'Moving Average Crossover Strategy',
        profit: 15.2,
        winRate: 68
      },
      { 
        id: 2, 
        name: 'RSI Strategy', 
        status: 'inactive',
        description: 'RSI Overbought/Oversold Strategy', 
        profit: 8.7,
        winRate: 62
      }
    ]
  });
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../dist')));

// 所有其他路由返回前端应用（必须放在最后）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CryptoQuant Production Server running on port ${PORT}`);
  console.log(`📊 Environment: production`);
  console.log(`🌐 Local Access: http://localhost:${PORT}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📱 Network Access: http://your-ip:${PORT}`);
});

export default app;