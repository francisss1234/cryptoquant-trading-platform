export interface IndicatorResult {
  values: number[];
  signals: string[];
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface StochasticResult {
  k: number[];
  d: number[];
}

export function calculateSMA(data: number[], period: number = 20): IndicatorResult {
  const values: number[] = [];
  const signals: string[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const sma = sum / period;
    values.push(sma);
    
    // 生成信号
    if (i > period) {
      const prevSMA = values[values.length - 2];
      if (data[i] > sma && data[i - 1] <= prevSMA) {
        signals.push('BUY');
      } else if (data[i] < sma && data[i - 1] >= prevSMA) {
        signals.push('SELL');
      } else {
        signals.push('HOLD');
      }
    } else {
      signals.push('HOLD');
    }
  }
  
  return { values, signals };
}

export function calculateEMA(data: number[], period: number = 20): IndicatorResult {
  const values: number[] = [];
  const signals: string[] = [];
  const multiplier = 2 / (period + 1);
  
  // 计算初始SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  values.push(ema);
  
  // 计算EMA
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    values.push(ema);
    
    // 生成信号
    if (i > period) {
      const prevEMA = values[values.length - 2];
      if (data[i] > ema && data[i - 1] <= prevEMA) {
        signals.push('BUY');
      } else if (data[i] < ema && data[i - 1] >= prevEMA) {
        signals.push('SELL');
      } else {
        signals.push('HOLD');
      }
    } else {
      signals.push('HOLD');
    }
  }
  
  return { values, signals };
}

export function calculateRSI(data: number[], period: number = 14): IndicatorResult {
  const values: number[] = [];
  const signals: string[] = [];
  
  let gains = 0;
  let losses = 0;
  
  // 计算初始平均收益和损失
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
      signals.push('SELL');
    } else if (rsi < 30) {
      signals.push('BUY');
    } else {
      signals.push('HOLD');
    }
  }
  
  return { values, signals };
}

export function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult {
  const fastEMA = calculateEMA(data, fastPeriod).values;
  const slowEMA = calculateEMA(data, slowPeriod).values;
  
  const macd: number[] = [];
  const signal: number[] = [];
  const histogram: number[] = [];
  
  // 计算MACD线
  for (let i = 0; i < fastEMA.length; i++) {
    const slowIndex = i + (slowPeriod - fastPeriod);
    if (slowIndex < slowEMA.length) {
      macd.push(fastEMA[i] - slowEMA[slowIndex]);
    }
  }
  
  // 计算信号线
  const signalEMA = calculateEMA(macd, signalPeriod).values;
  signal.push(...signalEMA);
  
  // 计算柱状图
  for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
    histogram.push(macd[i] - signal[i]);
  }
  
  return { macd, signal, histogram };
}

export function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): BollingerBandsResult {
  const sma = calculateSMA(data, period).values;
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    middle.push(mean);
    upper.push(mean + stdDev * standardDeviation);
    lower.push(mean - stdDev * standardDeviation);
  }
  
  return { upper, middle, lower };
}

export function calculateStochastic(data: number[], period: number = 14): StochasticResult {
  const k: number[] = [];
  const d: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const low = Math.min(...slice);
    const high = Math.max(...slice);
    const current = data[i];
    
    const kValue = ((current - low) / (high - low)) * 100;
    k.push(kValue);
  }
  
  // 计算D值（K值的3日简单移动平均）
  for (let i = 2; i < k.length; i++) {
    const dValue = (k[i] + k[i - 1] + k[i - 2]) / 3;
    d.push(dValue);
  }
  
  return { k, d };
}

export function calculateATR(data: number[], period: number = 14): IndicatorResult {
  const values: number[] = [];
  const signals: string[] = [];
  const tr: number[] = [];
  
  // 计算真实波幅（TR）
  for (let i = 1; i < data.length; i++) {
    const high = Math.max(data[i], data[i - 1]);
    const low = Math.min(data[i], data[i - 1]);
    tr.push(high - low);
  }
  
  // 计算ATR
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  let atr = sum / period;
  values.push(atr);
  
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    values.push(atr);
    signals.push('HOLD'); // ATR主要用于波动性分析，不直接产生交易信号
  }
  
  return { values, signals };
}

export function calculateVWAP(prices: number[], volumes: number[]): IndicatorResult {
  const values: number[] = [];
  const signals: string[] = [];
  
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < prices.length; i++) {
    cumulativePriceVolume += prices[i] * volumes[i];
    cumulativeVolume += volumes[i];
    
    if (cumulativeVolume > 0) {
      const vwap = cumulativePriceVolume / cumulativeVolume;
      values.push(vwap);
      
      // 生成信号
      if (i > 0) {
        const prevVWAP = values[values.length - 2];
        if (prices[i] > vwap && prices[i - 1] <= prevVWAP) {
          signals.push('BUY');
        } else if (prices[i] < vwap && prices[i - 1] >= prevVWAP) {
          signals.push('SELL');
        } else {
          signals.push('HOLD');
        }
      } else {
        signals.push('HOLD');
      }
    }
  }
  
  return { values, signals };
}

export function calculateMomentum(data: number[], period: number = 10): IndicatorResult {
  const values: number[] = [];
  const signals: string[] = [];
  
  for (let i = period; i < data.length; i++) {
    const momentum = ((data[i] - data[i - period]) / data[i - period]) * 100;
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