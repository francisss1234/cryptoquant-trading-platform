import { pool as mockDb } from '../config/database-mock.js'

export interface PerformanceMetrics {
  totalReturn: number
  sharpeRatio: number
  maximumDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageWin: number
  averageLoss: number
  expectedValue: number
  volatility: number
  var95: number
  var99: number
}

export interface ChartData {
  timestamp: string
  value: number
  label?: string
}

export interface TradeDistribution {
  hour: number
  tradeCount: number
  profit: number
}

export interface AssetAllocation {
  symbol: string
  allocation: number
  currentValue: number
  unrealizedPnL: number
}

export interface CorrelationData {
  symbol1: string
  symbol2: string
  correlation: number
}

export class VisualizationService {
  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(startDate?: Date, endDate?: Date): Promise<{
    metrics: PerformanceMetrics
    chartData: ChartData[]
    tradeDistribution: TradeDistribution[]
    assetAllocation: AssetAllocation[]
  }> {
    try {
      // Get trades from database
      const trades = await mockDb.query(`
        SELECT * FROM trades 
        WHERE created_at >= $1 AND created_at <= $2
        ORDER BY created_at ASC
      `, [startDate || new Date('2024-01-01'), endDate || new Date()])

      // Get portfolio data
      const portfolio = await mockDb.query(`
        SELECT * FROM portfolio_positions
        ORDER BY symbol
      `)

      // Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(trades.rows)
      
      // Generate chart data
      const chartData = this.generateEquityCurve(trades.rows)
      
      // Generate trade distribution
      const tradeDistribution = this.generateTradeDistribution(trades.rows)
      
      // Generate asset allocation
      const assetAllocation = this.generateAssetAllocation(portfolio.rows)

      return {
        metrics,
        chartData,
        tradeDistribution,
        assetAllocation
      }
    } catch (error) {
      console.error('Error generating performance report:', error)
      throw error
    }
  }

  /**
   * Generate correlation heatmap data
   */
  async generateCorrelationHeatmap(symbols: string[]): Promise<CorrelationData[]> {
    try {
      const correlations: CorrelationData[] = []
      
      // Mock correlation calculation
      for (let i = 0; i < symbols.length; i++) {
        for (let j = 0; j < symbols.length; j++) {
          const correlation = i === j ? 1 : Math.random() * 2 - 1 // Random correlation between -1 and 1
          correlations.push({
            symbol1: symbols[i],
            symbol2: symbols[j],
            correlation: Math.round(correlation * 100) / 100
          })
        }
      }
      
      return correlations
    } catch (error) {
      console.error('Error generating correlation heatmap:', error)
      throw error
    }
  }

  /**
   * Generate SVG line chart
   */
  async generateLineChart(data: ChartData[], width: number = 800, height: number = 400): Promise<string> {
    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'No data available')
    }

    const padding = 60
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    const minValue = Math.min(...data.map(d => d.value))
    const maxValue = Math.max(...data.map(d => d.value))
    const valueRange = maxValue - minValue || 1

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth
      const y = padding + (1 - (d.value - minValue) / valueRange) * chartHeight
      return `${x},${y}`
    }).join(' ')

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        
        <!-- Grid lines -->
        ${Array.from({ length: 5 }, (_, i) => {
          const y = padding + (i / 4) * chartHeight
          return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`
        }).join('')}
        
        <!-- Data line -->
        <polyline
          points="${points}"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
        />
        
        <!-- Area fill -->
        <polygon
          points="${points} ${width - padding},${height - padding} ${padding},${height - padding}"
          fill="url(#lineGradient)"
        />
        
        <!-- Axis -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#374151" stroke-width="2"/>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#374151" stroke-width="2"/>
        
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">
          Performance Chart
        </text>
      </svg>
    `
  }

  /**
   * Generate SVG candlestick chart
   */
  async generateCandlestickChart(data: any[], width: number = 800, height: number = 400): Promise<string> {
    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'No data available')
    }

    const padding = 60
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        
        <!-- Grid -->
        ${Array.from({ length: 5 }, (_, i) => {
          const y = padding + (i / 4) * chartHeight
          return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`
        }).join('')}
        
        <!-- Sample candles -->
        ${Array.from({ length: Math.min(20, data.length) }, (_, i) => {
          const x = padding + (i / 19) * chartWidth
          const isGreen = Math.random() > 0.5
          const color = isGreen ? '#10b981' : '#ef4444'
          
          return `
            <rect x="${x - 2}" y="${padding + chartHeight * 0.3}" width="4" height="${chartHeight * 0.4}" fill="${color}"/>
            <line x1="${x}" y1="${padding + chartHeight * 0.2}" x2="${x}" y2="${padding + chartHeight * 0.8}" stroke="${color}" stroke-width="1"/>
          `
        }).join('')}
        
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">
          Candlestick Chart
        </text>
      </svg>
    `
  }

  /**
   * Generate SVG bar chart
   */
  async generateBarChart(data: ChartData[], width: number = 800, height: number = 400): Promise<string> {
    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'No data available')
    }

    const padding = 60
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    const maxValue = Math.max(...data.map(d => d.value))
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        
        <!-- Grid -->
        ${Array.from({ length: 5 }, (_, i) => {
          const y = padding + (i / 4) * chartHeight
          return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`
        }).join('')}
        
        <!-- Bars -->
        ${data.map((d, i) => {
          const x = padding + i * (barWidth + barSpacing) + barSpacing / 2
          const barHeight = (d.value / maxValue) * chartHeight
          const y = padding + chartHeight - barHeight
          
          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="2"/>
            ${d.label ? `<text x="${x + barWidth / 2}" y="${height - padding + 20}" text-anchor="middle" font-size="12" fill="#6b7280">${d.label}</text>` : ''}
          `
        }).join('')}
        
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">
          Bar Chart
        </text>
      </svg>
    `
  }

  /**
   * Get portfolio composition
   */
  async getPortfolioComposition(): Promise<AssetAllocation[]> {
    try {
      const positions = await mockDb.query(`
        SELECT symbol, SUM(quantity) as total_quantity, 
               AVG(entry_price) as avg_entry_price
        FROM portfolio_positions
        GROUP BY symbol
        HAVING SUM(quantity) > 0
      `)

      const totalValue = positions.rows.reduce((sum, pos) => {
        return sum + (pos.total_quantity * pos.avg_entry_price)
      }, 0)

      return positions.rows.map(pos => ({
        symbol: pos.symbol,
        allocation: totalValue > 0 ? (pos.total_quantity * pos.avg_entry_price) / totalValue : 0,
        currentValue: pos.total_quantity * pos.avg_entry_price,
        unrealizedPnL: 0 // Simplified for mock
      }))
    } catch (error) {
      console.error('Error getting portfolio composition:', error)
      throw error
    }
  }

  /**
   * Get trade distribution
   */
  async getTradeDistribution(timeFrame: string = 'daily'): Promise<TradeDistribution[]> {
    try {
      const trades = await mockDb.query(`
        SELECT * FROM trades
        ORDER BY created_at ASC
      `)

      const distribution = new Map<number, { count: number; profit: number }>()

      trades.rows.forEach(trade => {
        const hour = new Date(trade.created_at).getHours()
        const current = distribution.get(hour) || { count: 0, profit: 0 }
        
        distribution.set(hour, {
          count: current.count + 1,
          profit: current.profit + (trade.realized_pnl || 0)
        })
      })

      return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        tradeCount: distribution.get(hour)?.count || 0,
        profit: distribution.get(hour)?.profit || 0
      }))
    } catch (error) {
      console.error('Error getting trade distribution:', error)
      throw error
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(trades: any[]): PerformanceMetrics {
    if (trades.length === 0) {
      return {
        totalReturn: 0,
        sharpeRatio: 0,
        maximumDrawdown: 0,
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        averageWin: 0,
        averageLoss: 0,
        expectedValue: 0,
        volatility: 0,
        var95: 0,
        var99: 0
      }
    }

    const winningTrades = trades.filter(t => (t.realized_pnl || 0) > 0)
    const losingTrades = trades.filter(t => (t.realized_pnl || 0) < 0)
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0))
    
    const winRate = winningTrades.length / trades.length
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit
    
    const returns = trades.map(t => t.realized_pnl || 0)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    
    const sortedReturns = [...returns].sort((a, b) => a - b)
    const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)] || 0
    const var99 = sortedReturns[Math.floor(sortedReturns.length * 0.01)] || 0

    return {
      totalReturn: totalProfit - totalLoss,
      sharpeRatio: volatility > 0 ? avgReturn / volatility : 0,
      maximumDrawdown: this.calculateMaxDrawdown(returns),
      winRate,
      profitFactor,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      expectedValue: avgReturn,
      volatility,
      var95,
      var99
    }
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(returns: number[]): number {
    let peak = 0
    let maxDrawdown = 0
    let currentValue = 0

    returns.forEach(ret => {
      currentValue += ret
      if (currentValue > peak) {
        peak = currentValue
      }
      const drawdown = (peak - currentValue) / peak
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    return maxDrawdown
  }

  /**
   * Generate equity curve data
   */
  private generateEquityCurve(trades: any[]): ChartData[] {
    const equityCurve: ChartData[] = []
    let currentEquity = 10000 // Starting equity

    trades.forEach((trade, index) => {
      currentEquity += trade.realized_pnl || 0
      equityCurve.push({
        timestamp: new Date(trade.created_at).toISOString(),
        value: currentEquity,
        label: `Trade ${index + 1}`
      })
    })

    return equityCurve
  }

  /**
   * Generate trade distribution data
   */
  private generateTradeDistribution(trades: any[]): TradeDistribution[] {
    const distribution = new Map<number, { count: number; profit: number }>()

    trades.forEach(trade => {
      const hour = new Date(trade.created_at).getHours()
      const current = distribution.get(hour) || { count: 0, profit: 0 }
      
      distribution.set(hour, {
        count: current.count + 1,
        profit: current.profit + (trade.realized_pnl || 0)
      })
    })

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      tradeCount: distribution.get(hour)?.count || 0,
      profit: distribution.get(hour)?.profit || 0
    }))
  }

  /**
   * Generate asset allocation data
   */
  private generateAssetAllocation(positions: any[]): AssetAllocation[] {
    const totalValue = positions.reduce((sum, pos) => {
      return sum + (pos.quantity * pos.entry_price)
    }, 0)

    return positions.map(pos => ({
      symbol: pos.symbol,
      allocation: totalValue > 0 ? (pos.quantity * pos.entry_price) / totalValue : 0,
      currentValue: pos.quantity * pos.entry_price,
      unrealizedPnL: 0 // Simplified for mock
    }))
  }

  /**
   * Generate empty chart
   */
  private generateEmptyChart(width: number, height: number, message: string): string {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="16" fill="#6b7280">
          ${message}
        </text>
      </svg>
    `
  }
}