import { DatabaseConnection } from '../config/database.js';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateStochastic, calculateATR, calculateVWAP, calculateMomentum } from './technicalIndicators.ts';
import { ExchangeManager } from './exchangeManager.js';

export interface StrategyConfig {
  id?: string;
  name: string;
  description: string;
  type: 'trend_following' | 'mean_reversion' | 'momentum' | 'arbitrage';
  parameters: Record<string, any>;
  indicators: string[];
  rules: StrategyRule[];
  risk_management: RiskManagementConfig;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface StrategyRule {
  condition: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  parameters: Record<string, any>;
  weight: number;
}

export interface RiskManagementConfig {
  max_position_size: number;
  stop_loss_percentage: number;
  take_profit_percentage: number;
  max_drawdown_percentage: number;
  position_sizing_method: 'fixed' | 'percentage' | 'kelly_criterion';
}

export interface BacktestResult {
  strategy_id: string;
  start_date: Date;
  end_date: Date;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  profit_factor: number;
  trades: Trade[];
}

export interface Trade {
  id?: string;
  strategy_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry_price: number;
  exit_price?: number;
  quantity: number;
  entry_time: Date;
  exit_time?: Date;
  pnl?: number;
  pnl_percentage?: number;
  status: 'OPEN' | 'CLOSED';
  reason: string;
}

export interface Signal {
  strategy_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  strength: number;
  confidence: number;
  indicators: Record<string, any>;
  timestamp: Date;
}

export class StrategyService {
  private db: DatabaseConnection;
  private exchangeManager: ExchangeManager;

  constructor() {
    this.db = new DatabaseConnection();
    this.exchangeManager = new ExchangeManager();
  }

  async createStrategy(config: StrategyConfig): Promise<StrategyConfig> {
    const strategy = {
      ...config,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.db.query(
      'INSERT INTO strategies (id, name, description, type, parameters, indicators, rules, risk_management, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [strategy.id, strategy.name, strategy.description, strategy.type, JSON.stringify(strategy.parameters), strategy.indicators, JSON.stringify(strategy.rules), JSON.stringify(strategy.risk_management), strategy.is_active, strategy.created_at, strategy.updated_at]
    );

    return strategy;
  }

  async getStrategy(id: string): Promise<StrategyConfig | null> {
    const result = await this.db.query('SELECT * FROM strategies WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    
    return {
      ...result.rows[0],
      parameters: JSON.parse(result.rows[0].parameters),
      indicators: result.rows[0].indicators,
      rules: JSON.parse(result.rows[0].rules),
      risk_management: JSON.parse(result.rows[0].risk_management)
    };
  }

  async getAllStrategies(): Promise<StrategyConfig[]> {
    const result = await this.db.query('SELECT * FROM strategies ORDER BY created_at DESC');
    return result.rows.map(row => ({
      ...row,
      parameters: JSON.parse(row.parameters),
      indicators: row.indicators,
      rules: JSON.parse(row.rules),
      risk_management: JSON.parse(row.risk_management)
    }));
  }

  async updateStrategy(id: string, updates: Partial<StrategyConfig>): Promise<StrategyConfig | null> {
    const existing = await this.getStrategy(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };

    await this.db.query(
      'UPDATE strategies SET name = $1, description = $2, parameters = $3, indicators = $4, rules = $5, risk_management = $6, is_active = $7, updated_at = $8 WHERE id = $9',
      [updated.name, updated.description, JSON.stringify(updated.parameters), updated.indicators, JSON.stringify(updated.rules), JSON.stringify(updated.risk_management), updated.is_active, updated.updated_at, id]
    );

    return updated;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM strategies WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async generateSignals(strategyId: string, symbol: string, timeframe: string = '1h'): Promise<Signal[]> {
    const strategy = await this.getStrategy(strategyId);
    if (!strategy || !strategy.is_active) return [];

    const ohlcv = await this.exchangeManager.fetchOHLCV('binance', symbol, timeframe, undefined, 100);
    const prices = ohlcv.map(candle => candle[4]); // Close prices
    const volumes = ohlcv.map(candle => candle[5]); // Volume
    
    const indicators = await this.calculateIndicators(prices, volumes, strategy.indicators);
    const signals = this.evaluateRules(strategy.rules, indicators, prices[prices.length - 1]);
    
    return signals.map(signal => ({
      strategy_id: strategyId,
      symbol,
      side: signal.action,
      price: prices[prices.length - 1],
      strength: signal.strength,
      confidence: signal.confidence,
      indicators,
      timestamp: new Date()
    }));
  }

  private async calculateIndicators(prices: number[], volumes: number[], indicatorNames: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const name of indicatorNames) {
      switch (name) {
        case 'SMA':
          results.SMA = calculateSMA(prices, 20);
          break;
        case 'EMA':
          results.EMA = calculateEMA(prices, 20);
          break;
        case 'RSI':
          results.RSI = calculateRSI(prices);
          break;
        case 'MACD':
          results.MACD = calculateMACD(prices);
          break;
        case 'BB':
          results.BB = calculateBollingerBands(prices);
          break;
        case 'STOCH':
          results.STOCH = calculateStochastic(prices);
          break;
        case 'ATR':
          results.ATR = calculateATR(prices);
          break;
        case 'VWAP':
          results.VWAP = calculateVWAP(prices, volumes);
          break;
        case 'MOM':
          results.MOM = calculateMomentum(prices);
          break;
      }
    }
    
    return results;
  }

  private evaluateRules(rules: StrategyRule[], indicators: Record<string, any>, currentPrice: number): Array<{action: 'BUY' | 'SELL', strength: number, confidence: number}> {
    const signals: Array<{action: 'BUY' | 'SELL', strength: number, confidence: number}> = [];
    
    for (const rule of rules) {
      const conditionMet = this.evaluateCondition(rule.condition, indicators, currentPrice);
      if (conditionMet && (rule.action === 'BUY' || rule.action === 'SELL')) {
        const strength = rule.weight;
        const confidence = this.calculateConfidence(indicators, rule);
        
        signals.push({
          action: rule.action,
          strength,
          confidence
        });
      }
    }
    
    return signals;
  }

  private evaluateCondition(condition: string, indicators: Record<string, any>, currentPrice: number): boolean {
    try {
      const latestIndicators: Record<string, number> = {};
      
      for (const [key, value] of Object.entries(indicators)) {
        if (value.values && value.values.length > 0) {
          latestIndicators[key] = value.values[value.values.length - 1];
        } else if (typeof value === 'number') {
          latestIndicators[key] = value;
        }
      }
      
      const conditionFunction = new Function('indicators', 'price', `return ${condition}`);
      return conditionFunction(latestIndicators, currentPrice);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private calculateConfidence(indicators: Record<string, any>, rule: StrategyRule): number {
    let confidence = 0.5;
    
    if (indicators.RSI) {
      const rsi = indicators.RSI.values[indicators.RSI.values.length - 1];
      if (rule.action === 'BUY' && rsi < 30) confidence += 0.2;
      if (rule.action === 'SELL' && rsi > 70) confidence += 0.2;
    }
    
    if (indicators.MACD) {
      const macd = indicators.MACD;
      const lastMacd = macd.macd[macd.macd.length - 1];
      const lastSignal = macd.signal[macd.signal.length - 1];
      if (rule.action === 'BUY' && lastMacd > lastSignal) confidence += 0.15;
      if (rule.action === 'SELL' && lastMacd < lastSignal) confidence += 0.15;
    }
    
    return Math.min(confidence, 1.0);
  }

  async backtestStrategy(strategyId: string, symbol: string, startDate: Date, endDate: Date, initialCapital: number): Promise<BacktestResult> {
    const strategy = await this.getStrategy(strategyId);
    if (!strategy) throw new Error('Strategy not found');

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    const ohlcv = await this.exchangeManager.fetchOHLCV('binance', symbol, '1d', startTime, undefined);
    const relevantData = ohlcv.filter(candle => {
      const candleTime = candle[0];
      return candleTime >= startTime && candleTime <= endTime;
    });

    let capital = initialCapital;
    let position = 0;
    const trades: Trade[] = [];
    let maxCapital = initialCapital;
    let maxDrawdown = 0;
    let totalPnL = 0;

    for (let i = 50; i < relevantData.length; i++) {
      const currentCandle = relevantData[i];
      const historicalData = relevantData.slice(0, i + 1);
      
      const prices = historicalData.map(candle => candle[4]);
      const volumes = historicalData.map(candle => candle[5]);
      
      const indicators = await this.calculateIndicators(prices, volumes, strategy.indicators);
      const signals = await this.generateSignals(strategyId, symbol, '1d');
      
      if (signals.length > 0) {
        const strongestSignal = signals.reduce((prev, current) => 
          prev.strength > current.strength ? prev : current
        );
        
        if (strongestSignal.side === 'BUY' && position === 0) {
          const quantity = this.calculatePositionSize(capital, currentCandle[4], strategy.risk_management);
          const cost = quantity * currentCandle[4];
          
          if (cost <= capital) {
            position = quantity;
            capital -= cost;
            
            trades.push({
              id: this.generateId(),
              strategy_id: strategyId,
              symbol,
              side: 'BUY',
              entry_price: currentCandle[4],
              quantity,
              entry_time: new Date(currentCandle[0]),
              status: 'OPEN',
              reason: 'Strategy signal'
            });
          }
        } else if (strongestSignal.side === 'SELL' && position > 0) {
          const exitPrice = currentCandle[4];
          const pnl = (exitPrice - trades[trades.length - 1].entry_price) * position;
          const pnlPercentage = ((exitPrice - trades[trades.length - 1].entry_price) / trades[trades.length - 1].entry_price) * 100;
          
          capital += position * exitPrice;
          totalPnL += pnl;
          
          const lastTrade = trades[trades.length - 1];
          lastTrade.exit_price = exitPrice;
          lastTrade.exit_time = new Date(currentCandle[0]);
          lastTrade.pnl = pnl;
          lastTrade.pnl_percentage = pnlPercentage;
          lastTrade.status = 'CLOSED';
          
          position = 0;
          
          maxCapital = Math.max(maxCapital, capital);
          const currentDrawdown = ((maxCapital - capital) / maxCapital) * 100;
          maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }
      }
      
      if (position > 0 && trades.length > 0) {
        const lastTrade = trades[trades.length - 1];
        const currentPrice = currentCandle[4];
        const pnlPercentage = ((currentPrice - lastTrade.entry_price) / lastTrade.entry_price) * 100;
        
        if (pnlPercentage <= -strategy.risk_management.stop_loss_percentage) {
          const exitPrice = currentPrice;
          const pnl = (exitPrice - lastTrade.entry_price) * position;
          
          capital += position * exitPrice;
          totalPnL += pnl;
          
          lastTrade.exit_price = exitPrice;
          lastTrade.exit_time = new Date(currentCandle[0]);
          lastTrade.pnl = pnl;
          lastTrade.pnl_percentage = pnlPercentage;
          lastTrade.status = 'CLOSED';
          lastTrade.reason = 'Stop loss';
          
          position = 0;
        }
      }
    }
    
    if (position > 0 && trades.length > 0) {
      const lastCandle = relevantData[relevantData.length - 1];
      const lastTrade = trades[trades.length - 1];
      const exitPrice = lastCandle[4];
      const pnl = (exitPrice - lastTrade.entry_price) * position;
      const pnlPercentage = ((exitPrice - lastTrade.entry_price) / lastTrade.entry_price) * 100;
      
      capital += position * exitPrice;
      totalPnL += pnl;
      
      lastTrade.exit_price = exitPrice;
      lastTrade.exit_time = new Date(lastCandle[0]);
      lastTrade.pnl = pnl;
      lastTrade.pnl_percentage = pnlPercentage;
      lastTrade.status = 'CLOSED';
      lastTrade.reason = 'Backtest end';
    }
    
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED');
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) <= 0);
    
    const totalReturn = ((capital - initialCapital) / initialCapital) * 100;
    const days = (endTime - startTime) / (1000 * 60 * 60 * 24);
    const annualizedReturn = (Math.pow(1 + totalReturn / 100, 365 / days) - 1) * 100;
    
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    const returns = closedTrades.map(trade => (trade.pnl_percentage || 0) / 100);
    const avgReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
    const returnStdDev = returns.length > 1 ? Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)) : 0;
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev * Math.sqrt(365) : 0;
    
    return {
      strategy_id: strategyId,
      start_date: startDate,
      end_date: endDate,
      initial_capital: initialCapital,
      final_capital: capital,
      total_return: totalReturn,
      annualized_return: annualizedReturn,
      max_drawdown: maxDrawdown,
      sharpe_ratio: sharpeRatio,
      win_rate: winRate,
      total_trades: closedTrades.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      profit_factor: profitFactor,
      trades
    };
  }

  private calculatePositionSize(capital: number, currentPrice: number, riskConfig: RiskManagementConfig): number {
    switch (riskConfig.position_sizing_method) {
      case 'fixed':
        return Math.floor(capital * 0.1 / currentPrice); // 10% of capital
      case 'percentage':
        return Math.floor(capital * (riskConfig.max_position_size / 100) / currentPrice);
      case 'kelly_criterion':
        const winRate = 0.6; // Assume 60% win rate
        const avgWin = 0.02; // Assume 2% average win
        const avgLoss = 0.01; // Assume 1% average loss
        const kelly = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
        return Math.floor(capital * Math.max(0, Math.min(kelly, 0.25)) / currentPrice);
      default:
        return Math.floor(capital * 0.1 / currentPrice);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}