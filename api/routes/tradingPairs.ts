import { Router } from 'express';
import { TradingPairStorageService } from '../services/TradingPairStorageService';
import { createExchangeManager } from '../services/exchange/ExchangeManager';
import { TradingPairDataCollector } from '../services/TradingPairDataCollector';
import { logger } from '../utils/logger';
import { auth } from '../middleware/auth';

const router = Router();

// 初始化服务
const storageService = new TradingPairStorageService();
const exchangeManager = createExchangeManager({
  binance: { enabled: true },
  coinbase: { enabled: true },
  okx: { enabled: true }
});

let dataCollector: TradingPairDataCollector | null = null;

// 初始化数据收集器
async function initializeDataCollector() {
  try {
    dataCollector = new TradingPairDataCollector(exchangeManager, storageService, {
      enabled: true,
      updateInterval: '*/5 * * * *', // 每5分钟更新
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000,
      cleanupInterval: '0 2 * * *', // 每天凌晨2点清理
      maxDataAge: 24 // 24小时
    });

    await dataCollector.start();
    logger.info('✅ 交易对数据收集器初始化完成');
  } catch (error) {
    logger.error('❌ 交易对数据收集器初始化失败:', error);
  }
}

// 启动数据收集器
initializeDataCollector();

// 获取交易对列表（支持分页和过滤）
router.get('/trading-pairs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      exchange,
      baseAsset,
      quoteAsset,
      status,
      symbol,
      search,
      sortBy = 'volume_24h',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 200), // 最大200条
      exchange: exchange as string,
      baseAsset: baseAsset as string,
      quoteAsset: quoteAsset as string,
      status: status as string,
      symbol: symbol as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC'
    };

    const result = await storageService.getTradingPairs(options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取交易对列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取交易对列表失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取单个交易对详情
router.get('/trading-pairs/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.query;

    if (!exchange) {
      return res.status(400).json({
        success: false,
        error: '缺少交易所参数'
      });
    }

    const pair = await storageService.getTradingPair(symbol, exchange as string);
    
    if (!pair) {
      return res.status(404).json({
        success: false,
        error: '交易对不存在'
      });
    }

    res.json({
      success: true,
      data: pair,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`获取交易对 ${req.params.symbol} 详情失败:`, error);
    res.status(500).json({
      success: false,
      error: '获取交易对详情失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取热门交易对
router.get('/trading-pairs/top/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit || '20');
    const { exchange } = req.query;

    const pairs = await storageService.getTopTradingPairs(
      Math.min(limit, 100), // 最多100条
      exchange as string
    );

    res.json({
      success: true,
      data: pairs,
      count: pairs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取热门交易对失败:', error);
    res.status(500).json({
      success: false,
      error: '获取热门交易对失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取交易所列表
router.get('/exchanges', async (req, res) => {
  try {
    const status = exchangeManager.getExchangeStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取交易所列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取交易所列表失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取数据收集器状态
router.get('/collector/status', async (req, res) => {
  try {
    if (!dataCollector) {
      return res.status(503).json({
        success: false,
        error: '数据收集器未初始化'
      });
    }

    const status = dataCollector.getStatus();
    const stats = dataCollector.getStats();
    const health = await dataCollector.getHealthStatus();

    res.json({
      success: true,
      data: {
        status,
        stats,
        health
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取数据收集器状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据收集器状态失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 手动触发数据更新（需要管理员权限）
router.post('/collector/update', auth, async (req, res) => {
  try {
    if (!dataCollector) {
      return res.status(503).json({
        success: false,
        error: '数据收集器未初始化'
      });
    }

    // 检查用户权限
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '需要管理员权限'
      });
    }

    const result = await dataCollector.manualUpdate();

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('手动更新失败:', error);
    res.status(500).json({
      success: false,
      error: '手动更新失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取数据更新统计
router.get('/collector/stats', async (req, res) => {
  try {
    const stats = await storageService.getUpdateStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取数据更新统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据更新统计失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取交易所状态
router.get('/health', async (req, res) => {
  try {
    if (!dataCollector) {
      return res.status(503).json({
        success: false,
        error: '数据收集器未初始化'
      });
    }

    const health = await dataCollector.getHealthStatus();
    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 503 : 503;

    res.status(httpStatus).json({
      success: health.status === 'healthy',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('健康检查失败:', error);
    res.status(503).json({
      success: false,
      error: '健康检查失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;