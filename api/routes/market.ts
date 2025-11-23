import { Router, Request, Response } from 'express';
import { marketDataService } from '../services/marketDataService.js';
import { exchangeManager } from '../services/exchangeManager.js';

const router = Router();

/**
 * 获取实时市场数据
 * GET /api/market/ticker/:exchange/:symbol
 */
router.get('/ticker/:exchange/:symbol', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol } = req.params;
    
    if (!exchangeManager.isExchangeConfigured(exchange)) {
      return res.status(400).json({ 
        error: `交易所 ${exchange} 未配置` 
      });
    }

    const ticker = await exchangeManager.fetchTicker(exchange, symbol);
    
    res.json({
      success: true,
      data: ticker
    });
  } catch (error) {
    console.error('获取实时行情失败:', error);
    res.status(500).json({ 
      error: '获取实时行情失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取K线数据
 * GET /api/market/ohlcv/:exchange/:symbol
 * Query params: timeframe, since, limit
 */
router.get('/ohlcv/:exchange/:symbol', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol } = req.params;
    const { timeframe = '1h', since, limit = '100' } = req.query;
    
    if (!exchangeManager.isExchangeConfigured(exchange)) {
      return res.status(400).json({ 
        error: `交易所 ${exchange} 未配置` 
      });
    }

    const ohlcv = await exchangeManager.fetchOHLCV(
      exchange, 
      symbol, 
      timeframe as string,
      since ? parseInt(since as string) : undefined,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: ohlcv,
      count: ohlcv.length
    });
  } catch (error) {
    console.error('获取K线数据失败:', error);
    res.status(500).json({ 
      error: '获取K线数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取订单簿数据
 * GET /api/market/orderbook/:exchange/:symbol
 * Query params: limit
 */
router.get('/orderbook/:exchange/:symbol', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol } = req.params;
    const { limit } = req.query;
    
    if (!exchangeManager.isExchangeConfigured(exchange)) {
      return res.status(400).json({ 
        error: `交易所 ${exchange} 未配置` 
      });
    }

    const orderBook = await exchangeManager.fetchOrderBook(
      exchange, 
      symbol,
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({
      success: true,
      data: orderBook
    });
  } catch (error) {
    console.error('获取订单簿数据失败:', error);
    res.status(500).json({ 
      error: '获取订单簿数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取历史K线数据（从数据库）
 * GET /api/market/history/:exchange/:symbol/:timeframe
 * Query params: startTime, endTime, limit
 */
router.get('/history/:exchange/:symbol/:timeframe', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol, timeframe } = req.params;
    const { startTime, endTime, limit = '1000' } = req.query;
    
    const data = await marketDataService.getMarketData(
      exchange,
      symbol,
      timeframe,
      startTime ? parseInt(startTime as string) : undefined,
      endTime ? parseInt(endTime as string) : undefined,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('获取历史数据失败:', error);
    res.status(500).json({ 
      error: '获取历史数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 同步历史数据到数据库
 * POST /api/market/sync/:exchange/:symbol
 * Body: { timeframe, since, limit }
 */
router.post('/sync/:exchange/:symbol', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol } = req.params;
    const { timeframe = '1h', since, limit = 1000 } = req.body;
    
    if (!exchangeManager.isExchangeConfigured(exchange)) {
      return res.status(400).json({ 
        error: `交易所 ${exchange} 未配置` 
      });
    }

    // 从交易所获取数据
    const ohlcv = await exchangeManager.fetchOHLCV(
      exchange,
      symbol,
      timeframe,
      since,
      limit
    );

    // 转换为市场数据格式
    const marketData = ohlcv.map(candle => ({
      exchange,
      symbol,
      timeframe,
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5]
    }));

    // 保存到数据库
    await marketDataService.saveMarketData(marketData);
    
    res.json({
      success: true,
      message: `成功同步 ${marketData.length} 条数据`,
      data: {
        exchange,
        symbol,
        timeframe,
        count: marketData.length,
        from: new Date(marketData[marketData.length - 1].timestamp).toISOString(),
        to: new Date(marketData[0].timestamp).toISOString()
      }
    });
  } catch (error) {
    console.error('同步历史数据失败:', error);
    res.status(500).json({ 
      error: '同步历史数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取数据统计信息
 * GET /api/market/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await marketDataService.getDataStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取数据统计失败:', error);
    res.status(500).json({ 
      error: '获取数据统计失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取支持的交易所列表
 * GET /api/market/exchanges
 */
router.get('/exchanges', (req: Request, res: Response) => {
  try {
    const exchanges = exchangeManager.getSupportedExchanges();
    const configuredExchanges = exchanges.filter(ex => exchangeManager.isExchangeConfigured(ex));
    
    res.json({
      success: true,
      data: {
        supported: exchanges,
        configured: configuredExchanges
      }
    });
  } catch (error) {
    console.error('获取交易所列表失败:', error);
    res.status(500).json({ 
      error: '获取交易所列表失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;