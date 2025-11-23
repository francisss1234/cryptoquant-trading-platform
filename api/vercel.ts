/**
 * Vercel serverless function entry file
 * Adapted for Vercel deployment
 */
import app from './app.js';
import { testConnection, initDatabase } from './config/database.js';
import { WebSocketService } from './services/websocketService.js';
import { MockDataGenerator } from './utils/mockDataGenerator.js';
import { ExchangeManager } from './services/exchangeManager.js';
import { MarketDataService } from './services/marketDataService.js';
import { TradingService } from './services/tradingService.js';
import { StrategyService } from './services/strategyService.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Vercel适配：检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;

let websocketService: WebSocketService | null = null;
let mockDataGenerator: MockDataGenerator | null = null;

/**
 * Initialize services for Vercel
 */
async function initializeServices() {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn('⚠️ 数据库连接失败，使用内存数据库模式');
    }

    // 初始化数据库
    await initDatabase();
    console.log('✅ 数据库初始化完成');

    // 初始化服务
    const exchangeManager = new ExchangeManager();
    const marketDataService = new MarketDataService();
    const tradingService = new TradingService();
    const strategyService = new StrategyService();
    
    // 初始化WebSocket服务
    websocketService = new WebSocketService(exchangeManager, marketDataService, tradingService, strategyService);
    console.log('✅ WebSocket服务初始化完成');

    // 在开发模式下启动模拟数据生成器
    if (process.env.NODE_ENV !== 'production') {
      mockDataGenerator = new MockDataGenerator(websocketService);
      mockDataGenerator.startGenerating();
      console.log('🚀 模拟数据生成器已启动');
    }

    return true;
  } catch (error) {
    console.error('❌ 服务初始化失败:', error);
    return false;
  }
}

// 立即初始化服务（Vercel冷启动时）
if (isVercel) {
  initializeServices().catch(console.error);
}

/**
 * Vercel无服务器函数处理器
 */
export default async function handler(req: any, res: any) {
  // 确保服务已初始化
  if (!websocketService) {
    const initialized = await initializeServices();
    if (!initialized) {
      return res.status(500).json({ error: '服务初始化失败' });
    }
  }

  // 创建HTTP服务器
  const server = createServer(app);
  
  // 初始化WebSocket（如果尚未初始化）
  if (websocketService && !websocketService.isWebSocketInitialized()) {
    websocketService.initializeWebSocket(server);
  }

  // 处理请求
  return app(req, res);
}

// 导出给Vercel使用
export { app };