import { Router, Request, Response } from 'express';
import { marketDataService } from '../services/marketDataService.js';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateATR,
  calculateVWAP,
  calculateMomentum,
  calculateMultipleIndicators
} from '../../src/utils/indicators.js';

const router = Router();

/**
 * 计算单个技术指标
 * POST /api/indicators/calculate
 * Body: { exchange, symbol, timeframe, indicatorType, params }
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol, timeframe, indicatorType, params = {} } = req.body;

    if (!exchange || !symbol || !timeframe || !indicatorType) {
      return res.status(400).json({
        error: '缺少必要参数: exchange, symbol, timeframe, indicatorType'
      });
    }

    // 获取历史数据
    const marketData = await marketDataService.getMarketData(exchange, symbol, timeframe, undefined, undefined, 1000);
    
    if (marketData.length === 0) {
      return res.status(404).json({
        error: '未找到市场数据，请先同步历史数据'
      });
    }

    // 提取价格数据
    const closePrices = marketData.map(d => d.close);
    const highPrices = marketData.map(d => d.high);
    const lowPrices = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);

    let result;

    // 计算指标
    switch (indicatorType) {
      case 'SMA':
        result = calculateSMA(closePrices, params.period || 20);
        break;
      case 'EMA':
        result = calculateEMA(closePrices, params.period || 20);
        break;
      case 'RSI':
        result = calculateRSI(closePrices, params.period || 14);
        break;
      case 'MACD':
        result = calculateMACD(
          closePrices,
          params.fastPeriod || 12,
          params.slowPeriod || 26,
          params.signalPeriod || 9
        );
        break;
      case 'BOLL':
        result = calculateBollingerBands(
          closePrices,
          params.period || 20,
          params.stdDev || 2
        );
        break;
      case 'STOCH':
        result = calculateStochastic(
          closePrices,
          highPrices,
          lowPrices,
          params.period || 14
        );
        break;
      case 'ATR':
        result = calculateATR(
          highPrices,
          lowPrices,
          closePrices,
          params.period || 14
        );
        break;
      case 'VWAP':
        result = calculateVWAP(
          highPrices,
          lowPrices,
          closePrices,
          volumes
        );
        break;
      case 'MOM':
        result = calculateMomentum(closePrices, params.period || 10);
        break;
      default:
        return res.status(400).json({
          error: `不支持的技术指标类型: ${indicatorType}`
        });
    }

    // 将结果与原始数据关联
    const indicatorData = marketData.slice(-result.values.length).map((data, index) => ({
      timestamp: data.timestamp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
      indicatorValue: result.values[index],
      signal: result.signals?.[index]
    }));

    res.json({
      success: true,
      data: {
        indicatorType,
        parameters: params,
        data: indicatorData,
        metadata: result.metadata || {},
        statistics: {
          totalCount: result.values.length,
          buySignals: result.signals?.filter(s => s === 'BUY').length || 0,
          sellSignals: result.signals?.filter(s => s === 'SELL').length || 0,
          holdSignals: result.signals?.filter(s => s === 'HOLD').length || 0
        }
      }
    });

  } catch (error) {
    console.error('计算技术指标失败:', error);
    res.status(500).json({
      error: '计算技术指标失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 计算多个技术指标
 * POST /api/indicators/multiple
 * Body: { exchange, symbol, timeframe, indicators: [{type, name, params}] }
 */
router.post('/multiple', async (req: Request, res: Response) => {
  try {
    const { exchange, symbol, timeframe, indicators } = req.body;

    if (!exchange || !symbol || !timeframe || !Array.isArray(indicators)) {
      return res.status(400).json({
        error: '缺少必要参数: exchange, symbol, timeframe, indicators(array)'
      });
    }

    // 获取历史数据
    const marketData = await marketDataService.getMarketData(exchange, symbol, timeframe, undefined, undefined, 1000);
    
    if (marketData.length === 0) {
      return res.status(404).json({
        error: '未找到市场数据，请先同步历史数据'
      });
    }

    // 准备数据
    const data = {
      close: marketData.map(d => d.close),
      high: marketData.map(d => d.high),
      low: marketData.map(d => d.low),
      volume: marketData.map(d => d.volume)
    };

    // 计算多个指标
    const results = calculateMultipleIndicators(data, indicators);

    // 构建响应数据
    const responseData = marketData.slice(-100).map((data, index) => {
      const result: any = {
        timestamp: data.timestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume
      };

      // 添加每个指标的值
      Object.keys(results).forEach(indicatorName => {
        const indicatorResult = results[indicatorName];
        const valueIndex = index + (marketData.length - 100);
        if (valueIndex < indicatorResult.values.length) {
          result[indicatorName] = indicatorResult.values[valueIndex];
          if (indicatorResult.signals) {
            result[`${indicatorName}_signal`] = indicatorResult.signals[valueIndex];
          }
        }
      });

      return result;
    });

    res.json({
      success: true,
      data: {
        indicators: results,
        combinedData: responseData
      }
    });

  } catch (error) {
    console.error('计算多个技术指标失败:', error);
    res.status(500).json({
      error: '计算多个技术指标失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取可用的技术指标列表
 * GET /api/indicators/list
 */
router.get('/list', (req: Request, res: Response) => {
  const indicators = [
    {
      type: 'SMA',
      name: '简单移动平均线',
      description: '计算指定周期内的平均价格',
      defaultParams: { period: 20 },
      category: '趋势指标'
    },
    {
      type: 'EMA',
      name: '指数移动平均线',
      description: '给予近期价格更高权重的移动平均线',
      defaultParams: { period: 20 },
      category: '趋势指标'
    },
    {
      type: 'RSI',
      name: '相对强弱指标',
      description: '衡量价格变动的速度和变化',
      defaultParams: { period: 14 },
      category: '动量指标'
    },
    {
      type: 'MACD',
      name: 'MACD指标',
      description: '显示两条移动平均线之间的关系',
      defaultParams: { 
        fastPeriod: 12, 
        slowPeriod: 26, 
        signalPeriod: 9 
      },
      category: '趋势指标'
    },
    {
      type: 'BOLL',
      name: '布林带',
      description: '显示价格的相对高低位',
      defaultParams: { period: 20, stdDev: 2 },
      category: '波动性指标'
    },
    {
      type: 'STOCH',
      name: '随机指标',
      description: '比较收盘价与价格范围',
      defaultParams: { period: 14 },
      category: '动量指标'
    },
    {
      type: 'ATR',
      name: '平均真实波幅',
      description: '衡量市场波动性',
      defaultParams: { period: 14 },
      category: '波动性指标'
    },
    {
      type: 'VWAP',
      name: '成交量加权平均价格',
      description: '考虑成交量的平均价格',
      defaultParams: {},
      category: '成交量指标'
    },
    {
      type: 'MOM',
      name: '动量指标',
      description: '衡量价格变化率',
      defaultParams: { period: 10 },
      category: '动量指标'
    }
  ];

  res.json({
    success: true,
    data: indicators
  });
});

export default router;