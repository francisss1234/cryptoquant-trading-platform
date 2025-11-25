/**
 * 技术指标计算模块
 * 提供常用的技术分析指标计算方法
 */

export interface IndicatorResult {
  values: number[];
  signals?: string[];
  metadata?: Record<string, any>;
}

/**
 * 简单移动平均线 (SMA)
 */
export function calculateSMA(data: number[], period: number): IndicatorResult {
  if (data.length < period) {
    return { values: [] };
  }

  const values: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    values.push(sum / period);
  }

  return { values };
}

/**
 * 指数移动平均线 (EMA)
 */
export function calculateEMA(data: number[], period: number): IndicatorResult {
  if (data.length < period) {
    return { values: [] };
  }

  const values: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // 第一个EMA值使用SMA计算
  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  values.push(firstSMA);

  // 计算后续的EMA值
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - values[values.length - 1]) * multiplier + values[values.length - 1];
    values.push(ema);
  }

  return { values };
}

/**
 * 相对强弱指标 (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): IndicatorResult {
  if (data.length < period + 1) {
    return { values: [] };
  }

  const values: number[] = [];
  const signals: string[] = [];
  
  let gains = 0;
  let losses = 0;

  // 计算初始的平均收益和损失
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 计算RSI值
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    values.push(rsi);
    
    // 生成信号
    if (rsi > 70) {
      signals.push('SELL'); // 超买
    } else if (rsi < 30) {
      signals.push('BUY'); // 超卖
    } else {
      signals.push('HOLD');
    }
  }

  return { values, signals };
}

/**
 * MACD指标 (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): IndicatorResult {
  if (data.length < slowPeriod + signalPeriod) {
    return { values: [] };
  }

  // 计算快速和慢速EMA
  const fastEMA = calculateEMA(data, fastPeriod).values;
  const slowEMA = calculateEMA(data, slowPeriod).values;

  // 计算MACD线
  const macdLine: number[] = [];
  for (let i = 0; i < fastEMA.length; i++) {
    if (i < slowEMA.length) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  // 计算信号线 (MACD的EMA)
  const signalLine = calculateEMA(macdLine, signalPeriod).values;

  // 计算柱状图
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (i < signalLine.length) {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  // 生成信号
  const signals: string[] = [];
  for (let i = 1; i < macdLine.length; i++) {
    const prevMACD = macdLine[i - 1];
    const currMACD = macdLine[i];
    const signal = signalLine[i] || 0;
    
    if (prevMACD < signal && currMACD > signal) {
      signals.push('BUY'); // 金叉
    } else if (prevMACD > signal && currMACD < signal) {
      signals.push('SELL'); // 死叉
    } else {
      signals.push('HOLD');
    }
  }

  return {
    values: macdLine,
    signals,
    metadata: {
      signalLine,
      histogram,
      fastEMA,
      slowEMA
    }
  };
}

/**
 * 布林带 (Bollinger Bands)
 */
export function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): IndicatorResult {
  if (data.length < period) {
    return { values: [] };
  }

  const sma = calculateSMA(data, period).values;
  const upperBand: number[] = [];
  const lowerBand: number[] = [];
  const middleBand: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    
    // 计算标准差
    const variance = slice.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    upperBand.push(mean + (standardDeviation * stdDev));
    lowerBand.push(mean - (standardDeviation * stdDev));
    middleBand.push(mean);
  }

  // 生成信号
  const signals: string[] = [];
  for (let i = 0; i < data.length - period + 1; i++) {
    const currentPrice = data[i + period - 1];
    const upper = upperBand[i];
    const lower = lowerBand[i];

    if (currentPrice > upper) {
      signals.push('SELL'); // 价格突破上轨
    } else if (currentPrice < lower) {
      signals.push('BUY'); // 价格跌破下轨
    } else {
      signals.push('HOLD');
    }
  }

  return {
    values: middleBand,
    signals,
    metadata: {
      upperBand,
      lowerBand,
      middleBand
    }
  };
}

/**
 * 随机指标 (Stochastic Oscillator)
 */
export function calculateStochastic(data: number[], high: number[], low: number[], period: number = 14): IndicatorResult {
  if (data.length < period) {
    return { values: [] };
  }

  const values: number[] = [];
  const signals: string[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const currentClose = data[i];
    const periodHigh = Math.max(...high.slice(i - period + 1, i + 1));
    const periodLow = Math.min(...low.slice(i - period + 1, i + 1));

    const k = ((currentClose - periodLow) / (periodHigh - periodLow)) * 100;
    values.push(k);

    // 生成信号
    if (k > 80) {
      signals.push('SELL'); // 超买
    } else if (k < 20) {
      signals.push('BUY'); // 超卖
    } else {
      signals.push('HOLD');
    }
  }

  return { values, signals };
}

/**
 * 平均真实波幅 (ATR)
 */
export function calculateATR(high: number[], low: number[], close: number[], period: number = 14): IndicatorResult {
  if (high.length < period + 1) {
    return { values: [] };
  }

  const trueRanges: number[] = [];
  
  // 计算真实波幅
  for (let i = 1; i < high.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  // 计算ATR (使用Wilder的平滑方法)
  const values: number[] = [];
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  values.push(atr);

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    values.push(atr);
  }

  return { values };
}

/**
 * 成交量加权平均价格 (VWAP)
 */
export function calculateVWAP(high: number[], low: number[], close: number[], volume: number[]): IndicatorResult {
  if (high.length !== volume.length) {
    return { values: [] };
  }

  const values: number[] = [];
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < high.length; i++) {
    const typicalPrice = (high[i] + low[i] + close[i]) / 3;
    const typicalPriceVolume = typicalPrice * volume[i];

    cumulativeTypicalPriceVolume += typicalPriceVolume;
    cumulativeVolume += volume[i];

    const vwap = cumulativeTypicalPriceVolume / cumulativeVolume;
    values.push(vwap);
  }

  return { values };
}

/**
 * 动量指标 (Momentum)
 */
export function calculateMomentum(data: number[], period: number = 10): IndicatorResult {
  if (data.length < period + 1) {
    return { values: [] };
  }

  const values: number[] = [];
  const signals: string[] = [];

  for (let i = period; i < data.length; i++) {
    const momentum = data[i] - data[i - period];
    values.push(momentum);

    // 生成信号
    if (momentum > 0) {
      signals.push('BUY');
    } else if (momentum < 0) {
      signals.push('SELL');
    } else {
      signals.push('HOLD');
    }
  }

  return { values, signals };
}

/**
 * 计算多个指标
 */
export function calculateMultipleIndicators(
  data: {
    close: number[];
    high?: number[];
    low?: number[];
    volume?: number[];
  },
  indicators: Array<{
    name: string;
    type: string;
    params?: Record<string, number>;
  }>
): Record<string, IndicatorResult> {
  const results: Record<string, IndicatorResult> = {};

  for (const indicator of indicators) {
    const { name, type, params = {} } = indicator;

    try {
      switch (type) {
        case 'SMA':
          results[name] = calculateSMA(data.close, params.period || 20);
          break;
        case 'EMA':
          results[name] = calculateEMA(data.close, params.period || 20);
          break;
        case 'RSI':
          results[name] = calculateRSI(data.close, params.period || 14);
          break;
        case 'MACD':
          results[name] = calculateMACD(
            data.close, 
            params.fastPeriod || 12, 
            params.slowPeriod || 26, 
            params.signalPeriod || 9
          );
          break;
        case 'BOLL':
          results[name] = calculateBollingerBands(data.close, params.period || 20, params.stdDev || 2);
          break;
        case 'STOCH':
          if (data.high && data.low) {
            results[name] = calculateStochastic(data.close, data.high, data.low, params.period || 14);
          }
          break;
        case 'ATR':
          if (data.high && data.low) {
            results[name] = calculateATR(data.high, data.low, data.close, params.period || 14);
          }
          break;
        case 'VWAP':
          if (data.high && data.low && data.volume) {
            results[name] = calculateVWAP(data.high, data.low, data.close, data.volume);
          }
          break;
        case 'MOM':
          results[name] = calculateMomentum(data.close, params.period || 10);
          break;
        default:
          console.warn(`Unknown indicator type: ${type}`);
      }
    } catch (error) {
      console.error(`Error calculating indicator ${name}:`, error);
      results[name] = { values: [] };
    }
  }

  return results;
}