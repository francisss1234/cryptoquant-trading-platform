/**
 * local server entry file, for local development
 */
import app from './app.js';
import { testConnection, initDatabase } from './config/database.js';
import { WebSocketService } from './services/websocketService.js';
import { ExchangeManager } from './services/exchangeManager.js';
import { MarketDataService } from './services/marketDataService.js';
import { TradingService } from './services/tradingService.js';
import { StrategyService } from './services/strategyService.js';
import { MockDataGenerator } from './utils/mockDataGenerator.js';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    // 初始化数据库表
    await initDatabase();
    
    // 创建HTTP服务器
    const server = createServer(app);
    
    // 初始化WebSocket服务
    const exchangeManager = new ExchangeManager();
    const marketDataService = new MarketDataService();
    const tradingService = new TradingService();
    const strategyService = new StrategyService();
    const websocketService = new WebSocketService(
      exchangeManager,
      marketDataService,
      tradingService,
      strategyService
    );
    
    websocketService.initializeWebSocket(server);
    
    // 将WebSocket服务实例附加到app上，供其他服务使用
    (app as any).websocketService = websocketService;
    
    // 启动模拟数据生成器（开发模式）
    if (process.env.NODE_ENV !== 'production') {
      const mockDataGenerator = new MockDataGenerator(websocketService);
      mockDataGenerator.startGenerating();
      console.log('🚀 模拟数据生成器已启动');
    }
    
    // 启动服务器
    server.listen(PORT, () => {
      console.log(`✅ 服务器启动成功，端口: ${PORT}`);
      console.log(`✅ WebSocket服务器已初始化`);
    });

    return server;
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

const server = await startServer();

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;