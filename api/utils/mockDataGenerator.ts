import { WebSocketService } from '../services/websocketService'

// 模拟数据生成器
export class MockDataGenerator {
  private wsService: WebSocketService
  private intervals: NodeJS.Timeout[] = []

  constructor(wsService: WebSocketService) {
    this.wsService = wsService
  }

  // 开始生成模拟数据
  startGenerating() {
    console.log('🚀 启动模拟数据生成器...')
    
    // 生成模拟价格数据
    this.intervals.push(setInterval(() => {
      this.generateMockPriceData()
    }, 2000)) // 每2秒更新一次

    // 生成模拟K线数据
    this.intervals.push(setInterval(() => {
      this.generateMockKlineData()
    }, 5000)) // 每5秒更新一次

    // 生成模拟订单簿数据
    this.intervals.push(setInterval(() => {
      this.generateMockOrderBookData()
    }, 3000)) // 每3秒更新一次

    // 生成模拟交易数据
    this.intervals.push(setInterval(() => {
      this.generateMockTradeData()
    }, 1000)) // 每1秒更新一次

    // 生成模拟策略信号
    this.intervals.push(setInterval(() => {
      this.generateMockStrategySignals()
    }, 10000)) // 每10秒生成一次信号
  }

  // 停止生成模拟数据
  stopGenerating() {
    console.log('🛑 停止模拟数据生成器')
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
  }

  private generateMockPriceData() {
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    const basePrices = { 'BTC/USDT': 45000, 'ETH/USDT': 3000, 'SOL/USDT': 100 }
    
    symbols.forEach(symbol => {
      const basePrice = basePrices[symbol as keyof typeof basePrices]
      const change = (Math.random() - 0.5) * basePrice * 0.02 // ±2% 变化
      const currentPrice = basePrice + change
      const open = currentPrice - (Math.random() - 0.5) * basePrice * 0.01
      
      // 使用正确的广播方法
      const realTimeData = {
        symbol,
        price: parseFloat(currentPrice.toFixed(2)),
        timestamp: Date.now(),
        volume: parseFloat((Math.random() * 1000).toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(((change / basePrice) * 100).toFixed(2))
      }
      
      // 广播到订阅了该symbol的客户端
      if ((this.wsService as any).io) {
        const subscriptionKey = `binance:${symbol}`
        ;(this.wsService as any).io.to(subscriptionKey).emit('price_update', realTimeData)
      }
    })
  }

  private generateMockKlineData() {
    const symbols = ['BTC/USDT', 'ETH/USDT']
    const intervals = ['1m', '5m', '15m']
    
    symbols.forEach(symbol => {
      intervals.forEach(interval => {
        const basePrice = symbol === 'BTC/USDT' ? 45000 : 3000
        const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.02
        
        const klineData = {
        symbol,
        exchange: 'binance',
        interval,
        timestamp: Date.now(),
        open: parseFloat((currentPrice - Math.random() * 100).toFixed(2)),
        high: parseFloat((currentPrice + Math.random() * 100).toFixed(2)),
        low: parseFloat((currentPrice - Math.random() * 100).toFixed(2)),
        close: parseFloat(currentPrice.toFixed(2)),
        volume: parseFloat((Math.random() * 1000).toFixed(2))
      }
      
      // 广播到订阅了该symbol和interval的客户端
      if ((this.wsService as any).io) {
        const subscriptionKey = `binance:${symbol}:${interval}`
        ;(this.wsService as any).io.to(subscriptionKey).emit('kline_update', klineData)
      }
      })
    })
  }

  private generateMockOrderBookData() {
    const symbols = ['BTC/USDT', 'ETH/USDT']
    
    symbols.forEach(symbol => {
      const basePrice = symbol === 'BTC/USDT' ? 45000 : 3000
      const asks = []
      const bids = []
      
      // 生成卖单 (Asks)
      for (let i = 0; i < 20; i++) {
        const price = basePrice + (i + 1) * 10 + Math.random() * 5
        const amount = Math.random() * 10
        asks.push([parseFloat(price.toFixed(2)), parseFloat(amount.toFixed(4))])
      }
      
      // 生成买单 (Bids)
      for (let i = 0; i < 20; i++) {
        const price = basePrice - (i + 1) * 10 - Math.random() * 5
        const amount = Math.random() * 10
        bids.push([parseFloat(price.toFixed(2)), parseFloat(amount.toFixed(4))])
      }
      
      const orderBookData = {
        symbol,
        exchange: 'binance',
        timestamp: Date.now(),
        asks,
        bids
      }
      
      // 广播到订阅了该symbol的客户端
      if ((this.wsService as any).io) {
        const subscriptionKey = `binance:${symbol}`
        ;(this.wsService as any).io.to(subscriptionKey).emit('orderbook_update', orderBookData)
      }
    })
  }

  private generateMockTradeData() {
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    const basePrices = { 'BTC/USDT': 45000, 'ETH/USDT': 3000, 'SOL/USDT': 100 }
    
    symbols.forEach(symbol => {
      const basePrice = basePrices[symbol as keyof typeof basePrices]
      const price = basePrice + (Math.random() - 0.5) * basePrice * 0.01
      const amount = Math.random() * 5
      const side = Math.random() > 0.5 ? 'buy' : 'sell'
      
      const tradeData = {
        symbol,
        exchange: 'binance',
        timestamp: Date.now(),
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        price: parseFloat(price.toFixed(2)),
        amount: parseFloat(amount.toFixed(4)),
        side,
        cost: parseFloat((price * amount).toFixed(2))
      }
      
      // 广播到订阅了该symbol的客户端
      if ((this.wsService as any).io) {
        const subscriptionKey = `binance:${symbol}`
        ;(this.wsService as any).io.to(subscriptionKey).emit('trade_update', tradeData)
      }
    })
  }

  private generateMockStrategySignals() {
    const strategies = [
      { id: 'MA_CROSSOVER', name: '均线交叉策略' },
      { id: 'RSI_STRATEGY', name: 'RSI策略' },
      { id: 'BOLLINGER_BANDS', name: '布林带策略' }
    ]
    
    const strategy = strategies[Math.floor(Math.random() * strategies.length)]
    const signalTypes = ['buy', 'sell', 'warning']
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)]
    
    const messages = {
      buy: [
        '检测到买入信号，价格突破关键阻力位',
        '均线金叉形成，建议买入',
        'RSI指标显示超卖反弹，考虑买入'
      ],
      sell: [
        '检测到卖出信号，价格跌破支撑位',
        '均线死叉形成，建议卖出',
        'RSI指标显示超买回调，考虑卖出'
      ],
      warning: [
        '市场波动率异常，请注意风险',
        '交易量异常，可能存在操纵',
        '价格偏离均线过远，注意回调风险'
      ]
    }
    
    const message = messages[signalType][Math.floor(Math.random() * messages[signalType].length)]
    
    const signalData = {
      strategyId: strategy.id,
      strategyName: strategy.name,
      type: signalType,
      message,
      timestamp: Date.now(),
      data: {
        symbol: 'BTC/USDT',
        price: parseFloat((45000 + (Math.random() - 0.5) * 2000).toFixed(2)),
        amount: parseFloat((Math.random() * 2).toFixed(4)),
        confidence: parseFloat((0.6 + Math.random() * 0.3).toFixed(2))
      }
    }
    
    // 广播到订阅了策略的客户端
    if ((this.wsService as any).io) {
      const subscriptionKey = `strategy:${strategy.id}`
      ;(this.wsService as any).io.to(subscriptionKey).emit('trading_signal', signalData)
    }
  }
}