import { DatabaseConnection } from '../config/database.js';
import { ExchangeManager } from './exchangeManager.js';
import { TradingService } from './tradingService.js';

export interface RiskMetrics {
  portfolio_value: number;
  daily_var: number; // Value at Risk (95% confidence)
  weekly_var: number;
  monthly_var: number;
  sharpe_ratio: number;
  maximum_drawdown: number;
  current_drawdown: number;
  volatility: number; // Annualized volatility
  beta: number;
  alpha: number;
  expected_shortfall: number; // Conditional VaR
  calmar_ratio: number;
  sortino_ratio: number;
  information_ratio: number;
  tracking_error: number;
  var_break_count: number; // Number of VaR breaks in last 252 days
}

export interface RiskAlert {
  id?: string;
  type: 'var_limit' | 'drawdown_limit' | 'position_limit' | 'exposure_limit' | 'volatility_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current_value: number;
  limit_value: number;
  timestamp: Date;
  acknowledged: boolean;
  strategy_id?: string;
  position_id?: string;
}

export interface RiskLimits {
  max_daily_var: number; // Maximum daily VaR as percentage of portfolio
  max_weekly_var: number;
  max_monthly_var: number;
  max_drawdown: number; // Maximum allowed drawdown
  max_position_size: number; // Maximum single position size
  max_sector_exposure: number; // Maximum exposure to single sector
  max_correlation: number; // Maximum correlation between positions
  min_sharpe_ratio: number; // Minimum required Sharpe ratio
  max_volatility: number; // Maximum portfolio volatility
  max_leverage: number; // Maximum leverage ratio
  var_confidence: number; // VaR confidence level (default 0.95)
  var_lookback_days: number; // VaR calculation lookback period
}

export interface PositionRisk {
  position_id: string;
  symbol: string;
  quantity: number;
  current_price: number;
  position_value: number;
  daily_var: number;
  contribution_to_portfolio_var: number;
  marginal_var: number;
  component_var: number;
  volatility: number;
  beta: number;
  correlation_to_market: number;
  sector: string;
  risk_grade: 'low' | 'medium' | 'high';
}

export class RiskManagementService {
  private db: DatabaseConnection;
  private exchangeManager: ExchangeManager;
  private tradingService: TradingService;
  private riskLimits: RiskLimits;
  private activeAlerts: RiskAlert[] = [];

  constructor() {
    this.db = new DatabaseConnection();
    this.exchangeManager = new ExchangeManager();
    this.tradingService = new TradingService();
    
    // 默认风险限制
    this.riskLimits = {
      max_daily_var: 0.02, // 2% daily VaR
      max_weekly_var: 0.05, // 5% weekly VaR
      max_monthly_var: 0.10, // 10% monthly VaR
      max_drawdown: 0.15, // 15% maximum drawdown
      max_position_size: 0.10, // 10% of portfolio in single position
      max_sector_exposure: 0.25, // 25% sector exposure limit
      max_correlation: 0.80, // 80% maximum correlation
      min_sharpe_ratio: 1.0, // Minimum Sharpe ratio
      max_volatility: 0.25, // 25% maximum annual volatility
      max_leverage: 2.0, // 2x maximum leverage
      var_confidence: 0.95, // 95% confidence level
      var_lookback_days: 252 // 1 year lookback
    };
  }

  async calculatePortfolioRiskMetrics(): Promise<RiskMetrics> {
    try {
      // 获取当前持仓
      const positions = await this.tradingService.getPositions();
      
      if (positions.length === 0) {
        return this.getDefaultRiskMetrics();
      }

      // 获取历史价格数据用于计算
      const historicalData = await this.getHistoricalReturns(positions);
      
      // 计算基本风险指标
      const portfolioValue = this.calculatePortfolioValue(positions);
      const returns = this.calculatePortfolioReturns(historicalData);
      const volatility = this.calculateVolatility(returns);
      const dailyReturns = returns.slice(-252); // 最近一年
      
      // 计算VaR
      const dailyVaR = this.calculateVaR(dailyReturns, this.riskLimits.var_confidence);
      const weeklyVaR = dailyVaR * Math.sqrt(5);
      const monthlyVaR = dailyVaR * Math.sqrt(21);
      
      // 计算回撤
      const drawdownMetrics = this.calculateDrawdown(returns);
      
      // 计算夏普比率
      const sharpeRatio = this.calculateSharpeRatio(returns);
      
      // 计算预期亏损（条件VaR）
      const expectedShortfall = this.calculateExpectedShortfall(dailyReturns, this.riskLimits.var_confidence);
      
      // 计算其他风险指标
      const calmarRatio = this.calculateCalmarRatio(returns, drawdownMetrics.maximumDrawdown);
      const sortinoRatio = this.calculateSortinoRatio(returns);
      
      const riskMetrics: RiskMetrics = {
        portfolio_value: portfolioValue,
        daily_var: dailyVaR,
        weekly_var: weeklyVaR,
        monthly_var: monthlyVaR,
        sharpe_ratio: sharpeRatio,
        maximum_drawdown: drawdownMetrics.maximumDrawdown,
        current_drawdown: drawdownMetrics.currentDrawdown,
        volatility: volatility,
        beta: 1.0, // 简化处理，实际应该计算相对基准的Beta
        alpha: 0, // 简化处理
        expected_shortfall: expectedShortfall,
        calmar_ratio: calmarRatio,
        sortino_ratio: sortinoRatio,
        information_ratio: 0, // 简化处理
        tracking_error: 0, // 简化处理
        var_break_count: this.countVaRBreaks(dailyReturns, dailyVaR)
      };

      return riskMetrics;
    } catch (error) {
      console.error('计算风险指标失败:', error);
      return this.getDefaultRiskMetrics();
    }
  }

  async calculatePositionRisk(positionId: string): Promise<PositionRisk | null> {
    try {
      // 获取持仓信息
      const positions = await this.tradingService.getPositions();
      const position = positions.find(p => p.id === positionId);
      
      if (!position) {
        return null;
      }

      // 获取历史数据
      const historicalData = await this.getPositionHistoricalData(position);
      const returns = this.calculateReturns(historicalData.prices);
      
      // 计算个股风险指标
      const dailyVaR = this.calculateVaR(returns, this.riskLimits.var_confidence);
      const volatility = this.calculateVolatility(returns);
      
      // 计算对组合VaR的贡献（简化计算）
      const portfolioRisk = await this.calculatePortfolioRiskMetrics();
      const positionValue = position.quantity * position.current_price;
      const weight = positionValue / portfolioRisk.portfolio_value;
      const contributionToVaR = weight * dailyVaR;
      
      // 风险等级评估
      const riskGrade = this.assessRiskGrade(volatility, dailyVaR);

      const positionRisk: PositionRisk = {
        position_id: position.id!,
        symbol: position.symbol,
        quantity: position.quantity,
        current_price: position.current_price,
        position_value: positionValue,
        daily_var: dailyVaR,
        contribution_to_portfolio_var: contributionToVaR,
        marginal_var: dailyVaR * weight, // 简化计算
        component_var: contributionToVaR, // 简化计算
        volatility: volatility,
        beta: 1.0, // 简化处理
        correlation_to_market: 0.8, // 简化处理
        sector: 'Crypto', // 简化处理
        risk_grade: riskGrade
      };

      return positionRisk;
    } catch (error) {
      console.error('计算持仓风险失败:', error);
      return null;
    }
  }

  async checkRiskLimits(): Promise<RiskAlert[]> {
    try {
      const riskMetrics = await this.calculatePortfolioRiskMetrics();
      const alerts: RiskAlert[] = [];

      // 检查VaR限制
      if (riskMetrics.daily_var > this.riskLimits.max_daily_var) {
        alerts.push({
          id: this.generateId(),
          type: 'var_limit',
          severity: 'high',
          message: `日VaR超出限制: ${(riskMetrics.daily_var * 100).toFixed(2)}% > ${(this.riskLimits.max_daily_var * 100).toFixed(2)}%`,
          current_value: riskMetrics.daily_var,
          limit_value: this.riskLimits.max_daily_var,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // 检查回撤限制
      if (riskMetrics.current_drawdown > this.riskLimits.max_drawdown) {
        alerts.push({
          id: this.generateId(),
          type: 'drawdown_limit',
          severity: 'critical',
          message: `当前回撤超出限制: ${(riskMetrics.current_drawdown * 100).toFixed(2)}% > ${(this.riskLimits.max_drawdown * 100).toFixed(2)}%`,
          current_value: riskMetrics.current_drawdown,
          limit_value: this.riskLimits.max_drawdown,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // 检查波动率限制
      if (riskMetrics.volatility > this.riskLimits.max_volatility) {
        alerts.push({
          id: this.generateId(),
          type: 'volatility_limit',
          severity: 'medium',
          message: `组合波动率超出限制: ${(riskMetrics.volatility * 100).toFixed(2)}% > ${(this.riskLimits.max_volatility * 100).toFixed(2)}%`,
          current_value: riskMetrics.volatility,
          limit_value: this.riskLimits.max_volatility,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // 检查夏普比率
      if (riskMetrics.sharpe_ratio < this.riskLimits.min_sharpe_ratio) {
        alerts.push({
          id: this.generateId(),
          type: 'exposure_limit',
          severity: 'low',
          message: `夏普比率低于要求: ${riskMetrics.sharpe_ratio.toFixed(2)} < ${this.riskLimits.min_sharpe_ratio}`,
          current_value: riskMetrics.sharpe_ratio,
          limit_value: this.riskLimits.min_sharpe_ratio,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // 检查持仓限制
      const positions = await this.tradingService.getPositions();
      for (const position of positions) {
        const positionValue = position.quantity * position.current_price;
        const positionSize = positionValue / riskMetrics.portfolio_value;
        if (positionSize > this.riskLimits.max_position_size) {
          alerts.push({
            id: this.generateId(),
            type: 'position_limit',
            severity: 'medium',
            message: `持仓${position.symbol}超出大小限制: ${(positionSize * 100).toFixed(2)}% > ${(this.riskLimits.max_position_size * 100).toFixed(2)}%`,
            current_value: positionSize,
            limit_value: this.riskLimits.max_position_size,
            timestamp: new Date(),
            acknowledged: false,
            position_id: position.id
          });
        }
      }

      // 保存新的风险预警
      for (const alert of alerts) {
        await this.saveRiskAlert(alert);
        this.activeAlerts.push(alert);
      }

      return alerts;
    } catch (error) {
      console.error('风险限制检查失败:', error);
      return [];
    }
  }

  async getRiskAlerts(severity?: string, acknowledged?: boolean): Promise<RiskAlert[]> {
    try {
      let query = 'SELECT * FROM risk_alerts WHERE 1=1';
      const params: any[] = [];
      
      if (severity) {
        query += ' AND severity = $1';
        params.push(severity);
      }
      
      if (acknowledged !== undefined) {
        query += ` AND acknowledged = $${params.length + 1}`;
        params.push(acknowledged);
      }
      
      query += ' ORDER BY timestamp DESC';
      
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('获取风险预警失败:', error);
      return [];
    }
  }

  async acknowledgeRiskAlert(alertId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'UPDATE risk_alerts SET acknowledged = true WHERE id = $1',
        [alertId]
      );
      
      // 更新内存中的预警状态
      const alert = this.activeAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('确认风险预警失败:', error);
      return false;
    }
  }

  async updateRiskLimits(newLimits: Partial<RiskLimits>): Promise<RiskLimits> {
    this.riskLimits = { ...this.riskLimits, ...newLimits };
    
    // 保存到数据库
    try {
      await this.db.query(
        'UPDATE risk_limits SET limits = $1, updated_at = $2 WHERE id = 1',
        [JSON.stringify(this.riskLimits), new Date()]
      );
    } catch (error) {
      console.error('更新风险限制失败:', error);
    }
    
    return this.riskLimits;
  }

  async getRiskLimits(): Promise<RiskLimits> {
    return this.riskLimits;
  }

  // 私有辅助方法
  private getDefaultRiskMetrics(): RiskMetrics {
    return {
      portfolio_value: 0,
      daily_var: 0,
      weekly_var: 0,
      monthly_var: 0,
      sharpe_ratio: 0,
      maximum_drawdown: 0,
      current_drawdown: 0,
      volatility: 0,
      beta: 0,
      alpha: 0,
      expected_shortfall: 0,
      calmar_ratio: 0,
      sortino_ratio: 0,
      information_ratio: 0,
      tracking_error: 0,
      var_break_count: 0
    };
  }

  private async getHistoricalReturns(positions: any[]): Promise<number[]> {
    // 简化实现：返回模拟的历史收益数据
    const returns: number[] = [];
    for (let i = 0; i < 252; i++) {
      returns.push((Math.random() - 0.5) * 0.02); // 模拟日收益，标准差约2%
    }
    return returns;
  }

  private calculatePortfolioValue(positions: any[]): number {
    return positions.reduce((total, pos) => total + (pos.current_price * pos.quantity), 0);
  }

  private calculatePortfolioReturns(historicalData: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      returns.push((historicalData[i] - historicalData[i - 1]) / historicalData[i - 1]);
    }
    return returns;
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const dailyVol = Math.sqrt(variance);
    
    return dailyVol * Math.sqrt(252); // 年化波动率
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const varReturn = sortedReturns[Math.max(0, index)];
    
    return Math.abs(varReturn);
  }

  private calculateExpectedShortfall(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoff = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, cutoff);
    
    if (tailReturns.length === 0) return 0;
    
    const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    return Math.abs(avgTailReturn);
  }

  private calculateDrawdown(returns: number[]): { maximumDrawdown: number; currentDrawdown: number } {
    if (returns.length === 0) return { maximumDrawdown: 0, currentDrawdown: 0 };
    
    let peak = 1;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let currentValue = 1;
    
    for (const ret of returns) {
      currentValue *= (1 + ret);
      
      if (currentValue > peak) {
        peak = currentValue;
      }
      
      const drawdown = (peak - currentValue) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
      currentDrawdown = drawdown;
    }
    
    return { maximumDrawdown: maxDrawdown, currentDrawdown: currentDrawdown };
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    
    if (volatility === 0) return 0;
    
    const riskFreeRate = 0.02 / 252; // 假设无风险利率2%年化
    return (meanReturn * 252 - riskFreeRate * 252) / volatility;
  }

  private calculateCalmarRatio(returns: number[], maxDrawdown: number): number {
    if (returns.length === 0 || maxDrawdown === 0) return 0;
    
    const totalReturn = returns.reduce((product, r) => product * (1 + r), 1) - 1;
    const annualizedReturn = Math.pow(1 + totalReturn, 252 / returns.length) - 1;
    
    return annualizedReturn / maxDrawdown;
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);
    
    if (downsideReturns.length === 0) return Infinity;
    
    const downsideDeviation = Math.sqrt(
      downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length
    ) * Math.sqrt(252);
    
    const riskFreeRate = 0.02 / 252;
    return (meanReturn * 252 - riskFreeRate * 252) / downsideDeviation;
  }

  private countVaRBreaks(returns: number[], varLevel: number): number {
    return returns.filter(ret => Math.abs(ret) > varLevel).length;
  }

  private assessRiskGrade(volatility: number, varLevel: number): 'low' | 'medium' | 'high' {
    const riskScore = volatility * 0.6 + varLevel * 0.4;
    
    if (riskScore < 0.01) return 'low';
    if (riskScore < 0.025) return 'medium';
    return 'high';
  }

  private async getPositionHistoricalData(position: any): Promise<{ prices: number[] }> {
    // 简化实现：返回模拟的历史价格数据
    const prices: number[] = [];
    const currentPrice = position.current_price;
    
    for (let i = 0; i < 252; i++) {
      const randomChange = (Math.random() - 0.5) * 0.04; // ±2% daily change
      prices.push(currentPrice * (1 + randomChange));
    }
    
    return { prices };
  }

  private async saveRiskAlert(alert: RiskAlert): Promise<void> {
    try {
      await this.db.query(
        'INSERT INTO risk_alerts (id, type, severity, message, current_value, limit_value, timestamp, acknowledged, strategy_id, position_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          alert.id, alert.type, alert.severity, alert.message,
          alert.current_value, alert.limit_value, alert.timestamp,
          alert.acknowledged, alert.strategy_id, alert.position_id
        ]
      );
    } catch (error) {
      console.error('保存风险预警失败:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}