import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { ExchangeManager } from './exchangeManager.js'
import { MarketDataService } from './marketDataService.js'
import { TradingService } from './tradingService.js'
import { StrategyService } from './strategyService.js'

export interface RealTimeData {
  symbol: string
  price: number
  timestamp: number
  volume?: number
  change?: number
  changePercent?: number
}

export interface KlineData {
  symbol: string
  timeframe: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OrderBookData {
  symbol: string
  bids: [number, number][]
  asks: [number, number][]
  timestamp: number
}

export interface TradeData {
  symbol: string
  price: number
  amount: number
  side: 'buy' | 'sell'
  timestamp: number
}

export interface SignalData {
  strategyId: string
  symbol: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  price: number
  strength: number
  timestamp: number
  metadata?: any
}

export class WebSocketService {
  private io: SocketIOServer | null = null
  private exchangeManager: ExchangeManager
  private marketDataService: MarketDataService
  private tradingService: TradingService
  private strategyService: StrategyService
  private connectedExchanges: Map<string, any> = new Map()
  private subscribedSymbols: Map<string, Set<string>> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000

  constructor(
    exchangeManager: ExchangeManager,
    marketDataService: MarketDataService,
    tradingService: TradingService,
    strategyService: StrategyService
  ) {
    this.exchangeManager = exchangeManager
    this.marketDataService = marketDataService
    this.tradingService = tradingService
    this.strategyService = strategyService
  }

  /**
   * Initialize WebSocket server
   */
  initializeWebSocket(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupSocketHandlers()
    this.startExchangeConnections()
    console.log('✅ WebSocket服务器初始化完成')
  }

  /**
   * Check if WebSocket server is initialized
   */
  isWebSocketInitialized(): boolean {
    return this.io !== null
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`🔗 客户端连接: ${socket.id}`)

      // Handle symbol subscription
      socket.on('subscribe_symbol', (data: { symbol: string; exchange: string }) => {
        this.handleSymbolSubscription(socket, data)
      })

      // Handle symbol unsubscription
      socket.on('unsubscribe_symbol', (data: { symbol: string; exchange: string }) => {
        this.handleSymbolUnsubscription(socket, data)
      })

      // Handle kline subscription
      socket.on('subscribe_kline', (data: { symbol: string; timeframe: string; exchange: string }) => {
        this.handleKlineSubscription(socket, data)
      })

      // Handle orderbook subscription
      socket.on('subscribe_orderbook', (data: { symbol: string; exchange: string }) => {
        this.handleOrderBookSubscription(socket, data)
      })

      // Handle trades subscription
      socket.on('subscribe_trades', (data: { symbol: string; exchange: string }) => {
        this.handleTradesSubscription(socket, data)
      })

      // Handle strategy subscription
      socket.on('subscribe_strategy', (data: { strategyId: string }) => {
        this.handleStrategySubscription(socket, data)
      })

      // Handle portfolio subscription
      socket.on('subscribe_portfolio', () => {
        this.handlePortfolioSubscription(socket)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ 客户端断开连接: ${socket.id}`)
        this.cleanupSocketSubscriptions(socket)
      })
    })
  }

  /**
   * Start exchange WebSocket connections
   */
  private async startExchangeConnections(): Promise<void> {
    const exchanges = ['binance', 'okx', 'coinbase']
    
    for (const exchangeId of exchanges) {
      try {
        await this.connectToExchange(exchangeId)
      } catch (error) {
        console.error(`❌ 连接交易所 ${exchangeId} 失败:`, error)
        this.scheduleReconnect(exchangeId)
      }
    }
  }

  /**
   * Connect to exchange WebSocket
   */
  private async connectToExchange(exchangeId: string): Promise<void> {
    try {
      const exchange = await this.exchangeManager.getExchange(exchangeId)
      
      if (!exchange.has['watchTicker'] && !exchange.has['watchOHLCV']) {
        console.warn(`⚠️ 交易所 ${exchangeId} 不支持WebSocket实时数据`)
        return
      }

      this.connectedExchanges.set(exchangeId, exchange)
      this.reconnectAttempts.set(exchangeId, 0)
      
      console.log(`✅ 连接交易所 ${exchangeId} WebSocket成功`)
      
      // Start watching market data
      this.startMarketDataWatchers(exchangeId)
      
    } catch (error) {
      console.error(`❌ 连接交易所 ${exchangeId} 失败:`, error)
      throw error
    }
  }

  /**
   * Start market data watchers for exchange
   */
  private async startMarketDataWatchers(exchangeId: string): Promise<void> {
    const exchange = this.connectedExchanges.get(exchangeId)
    if (!exchange) return

    // Watch tickers if supported
    if (exchange.has['watchTicker']) {
      this.watchTickers(exchangeId)
    }

    // Watch OHLCV if supported
    if (exchange.has['watchOHLCV']) {
      this.watchOHLCV(exchangeId)
    }

    // Watch orderbook if supported
    if (exchange.has['watchOrderBook']) {
      this.watchOrderBook(exchangeId)
    }

    // Watch trades if supported
    if (exchange.has['watchTrades']) {
      this.watchTrades(exchangeId)
    }
  }

  /**
   * Watch real-time tickers
   */
  private async watchTickers(exchangeId: string): Promise<void> {
    const exchange = this.connectedExchanges.get(exchangeId)
    if (!exchange || !exchange.has['watchTicker']) return

    try {
      while (true) {
        const tickers = await exchange.watchTickers()
        
        for (const symbol in tickers) {
          const ticker = tickers[symbol]
          const realTimeData: RealTimeData = {
            symbol,
            price: ticker.last,
            timestamp: ticker.timestamp || Date.now(),
            volume: ticker.baseVolume,
            change: ticker.change,
            changePercent: ticker.percentage
          }

          // Broadcast to subscribed clients
          this.broadcastToSymbolSubscribers(exchangeId, symbol, 'price_update', realTimeData)
        }
      }
    } catch (error) {
      console.error(`❌ 监听交易所 ${exchangeId} 价格数据失败:`, error)
      this.handleExchangeError(exchangeId, error)
    }
  }

  /**
   * Watch OHLCV (K-line) data
   */
  private async watchOHLCV(exchangeId: string): Promise<void> {
    const exchange = this.connectedExchanges.get(exchangeId)
    if (!exchange || !exchange.has['watchOHLCV']) return

    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d']
    
    for (const timeframe of timeframes) {
      this.watchOHLCVForTimeframe(exchangeId, timeframe)
    }
  }

  /**
   * Watch OHLCV for specific timeframe
   */
  private async watchOHLCVForTimeframe(exchangeId: string, timeframe: string): Promise<void> {
    const exchange = this.connectedExchanges.get(exchangeId)
    if (!exchange) return

    try {
      while (true) {
        const symbols = this.getSubscribedSymbolsForKline(exchangeId, timeframe)
        
        for (const symbol of symbols) {
          const ohlcv = await exchange.watchOHLCV(symbol, timeframe)
          
          if (ohlcv && ohlcv.length > 0) {
            const latest = ohlcv[ohlcv.length - 1]
            const klineData: KlineData = {
              symbol,
              timeframe,
              timestamp: latest[0],
              open: latest[1],
              high: latest[2],
              low: latest[3],
              close: latest[4],
              volume: latest[5]
            }

            this.broadcastToKlineSubscribers(exchangeId, symbol, timeframe, 'kline_update', klineData)
          }
        }
      }
    } catch (error) {
      console.error(`❌ 监听交易所 ${exchangeId} ${timeframe} K线数据失败:`, error)
      this.handleExchangeError(exchangeId, error)
    }
  }

  /**
   * Watch orderbook data
   */
  private async watchOrderBook(exchangeId: string): Promise<void> {
    const exchange = this.connectedExchanges.get(exchangeId)
    if (!exchange || !exchange.has['watchOrderBook']) return

    try {
      while (true) {
        const symbols = this.getSubscribedSymbolsForOrderBook(exchangeId)
        
        for (const symbol of symbols) {
          const orderBook = await exchange.watchOrderBook(symbol)
          
          const orderBookData: OrderBookData = {
            symbol,
            bids: orderBook.bids.slice(0, 10), // Top 10 bids
            asks: orderBook.asks.slice(0, 10), // Top 10 asks
            timestamp: Date.now()
          }

          this.broadcastToOrderBookSubscribers(exchangeId, symbol, 'orderbook_update', orderBookData)
        }
      }
    } catch (error) {
      console.error(`❌ 监听交易所 ${exchangeId} 订单簿数据失败:`, error)
      this.handleExchangeError(exchangeId, error)
    }
  }

  /**
   * Watch trades data
   */
  private async watchTrades(exchangeId: string): Promise<void> {
    const exchange = this.connectedExchanges.get(exchangeId)
    if (!exchange || !exchange.has['watchTrades']) return

    try {
      while (true) {
        const symbols = this.getSubscribedSymbolsForTrades(exchangeId)
        
        for (const symbol of symbols) {
          const trades = await exchange.watchTrades(symbol)
          
          for (const trade of trades) {
            const tradeData: TradeData = {
              symbol,
              price: trade.price,
              amount: trade.amount,
              side: trade.side,
              timestamp: trade.timestamp
            }

            this.broadcastToTradesSubscribers(exchangeId, symbol, 'trade_update', tradeData)
          }
        }
      }
    } catch (error) {
      console.error(`❌ 监听交易所 ${exchangeId} 成交数据失败:`, error)
      this.handleExchangeError(exchangeId, error)
    }
  }

  /**
   * Handle symbol subscription
   */
  private handleSymbolSubscription(socket: any, data: { symbol: string; exchange: string }): void {
    const { symbol, exchange } = data
    const subscriptionKey = `${exchange}:${symbol}`
    
    if (!this.subscribedSymbols.has(subscriptionKey)) {
      this.subscribedSymbols.set(subscriptionKey, new Set())
    }
    
    this.subscribedSymbols.get(subscriptionKey)?.add(socket.id)
    socket.join(subscriptionKey)
    
    console.log(`✅ 客户端 ${socket.id} 订阅 ${subscriptionKey}`)
    socket.emit('subscription_confirmed', { symbol, exchange, type: 'symbol' })
  }

  /**
   * Handle symbol unsubscription
   */
  private handleSymbolUnsubscription(socket: any, data: { symbol: string; exchange: string }): void {
    const { symbol, exchange } = data
    const subscriptionKey = `${exchange}:${symbol}`
    
    this.subscribedSymbols.get(subscriptionKey)?.delete(socket.id)
    socket.leave(subscriptionKey)
    
    console.log(`❌ 客户端 ${socket.id} 取消订阅 ${subscriptionKey}`)
  }

  /**
   * Handle kline subscription
   */
  private handleKlineSubscription(socket: any, data: { symbol: string; timeframe: string; exchange: string }): void {
    const { symbol, timeframe, exchange } = data
    const subscriptionKey = `${exchange}:${symbol}:${timeframe}`
    
    socket.join(subscriptionKey)
    console.log(`✅ 客户端 ${socket.id} 订阅K线 ${subscriptionKey}`)
    socket.emit('subscription_confirmed', { symbol, exchange, timeframe, type: 'kline' })
  }

  /**
   * Handle orderbook subscription
   */
  private handleOrderBookSubscription(socket: any, data: { symbol: string; exchange: string }): void {
    const { symbol, exchange } = data
    const subscriptionKey = `${exchange}:${symbol}:orderbook`
    
    socket.join(subscriptionKey)
    console.log(`✅ 客户端 ${socket.id} 订阅订单簿 ${subscriptionKey}`)
    socket.emit('subscription_confirmed', { symbol, exchange, type: 'orderbook' })
  }

  /**
   * Handle trades subscription
   */
  private handleTradesSubscription(socket: any, data: { symbol: string; exchange: string }): void {
    const { symbol, exchange } = data
    const subscriptionKey = `${exchange}:${symbol}:trades`
    
    socket.join(subscriptionKey)
    console.log(`✅ 客户端 ${socket.id} 订阅成交 ${subscriptionKey}`)
    socket.emit('subscription_confirmed', { symbol, exchange, type: 'trades' })
  }

  /**
   * Handle strategy subscription
   */
  private handleStrategySubscription(socket: any, data: { strategyId: string }): void {
    const { strategyId } = data
    const subscriptionKey = `strategy:${strategyId}`
    
    socket.join(subscriptionKey)
    console.log(`✅ 客户端 ${socket.id} 订阅策略 ${strategyId}`)
    socket.emit('subscription_confirmed', { strategyId, type: 'strategy' })
  }

  /**
   * Handle portfolio subscription
   */
  private handlePortfolioSubscription(socket: any): void {
    socket.join('portfolio_updates')
    console.log(`✅ 客户端 ${socket.id} 订阅投资组合更新`)
    socket.emit('subscription_confirmed', { type: 'portfolio' })
  }

  /**
   * Broadcast to symbol subscribers
   */
  private broadcastToSymbolSubscribers(exchange: string, symbol: string, event: string, data: any): void {
    const subscriptionKey = `${exchange}:${symbol}`
    if (this.io) {
      this.io.to(subscriptionKey).emit(event, data)
    }
  }

  /**
   * Broadcast to kline subscribers
   */
  private broadcastToKlineSubscribers(exchange: string, symbol: string, timeframe: string, event: string, data: any): void {
    const subscriptionKey = `${exchange}:${symbol}:${timeframe}`
    if (this.io) {
      this.io.to(subscriptionKey).emit(event, data)
    }
  }

  /**
   * Broadcast to orderbook subscribers
   */
  private broadcastToOrderBookSubscribers(exchange: string, symbol: string, event: string, data: any): void {
    const subscriptionKey = `${exchange}:${symbol}:orderbook`
    if (this.io) {
      this.io.to(subscriptionKey).emit(event, data)
    }
  }

  /**
   * Broadcast to trades subscribers
   */
  private broadcastToTradesSubscribers(exchange: string, symbol: string, event: string, data: any): void {
    const subscriptionKey = `${exchange}:${symbol}:trades`
    if (this.io) {
      this.io.to(subscriptionKey).emit(event, data)
    }
  }

  /**
   * Broadcast trading signal
   */
  broadcastSignal(signalData: SignalData): void {
    const subscriptionKey = `strategy:${signalData.strategyId}`
    if (this.io) {
      this.io.to(subscriptionKey).emit('trading_signal', signalData)
      console.log(`📊 广播交易信号: ${signalData.strategyId} - ${signalData.signal}`)
    }
  }

  /**
   * Broadcast order update
   */
  broadcastOrderUpdate(orderData: any): void {
    if (this.io) {
      this.io.to('portfolio_updates').emit('order_update', orderData)
      console.log(`📈 广播订单更新: ${orderData.id} - ${orderData.status}`)
    }
  }

  /**
   * Broadcast portfolio update
   */
  broadcastPortfolioUpdate(portfolioData: any): void {
    if (this.io) {
      this.io.to('portfolio_updates').emit('portfolio_update', portfolioData)
      console.log(`💼 广播投资组合更新`)
    }
  }

  /**
   * Handle exchange error
   */
  private handleExchangeError(exchangeId: string, error: any): void {
    console.error(`❌ 交易所 ${exchangeId} 错误:`, error)
    this.connectedExchanges.delete(exchangeId)
    this.scheduleReconnect(exchangeId)
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(exchangeId: string): void {
    const attempts = this.reconnectAttempts.get(exchangeId) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`❌ 交易所 ${exchangeId} 重连失败，已达到最大重试次数`)
      return
    }

    this.reconnectAttempts.set(exchangeId, attempts + 1)
    
    const delay = this.reconnectDelay * Math.pow(2, attempts) // Exponential backoff
    
    console.log(`🔄 ${delay/1000}秒后重连交易所 ${exchangeId} (尝试 ${attempts + 1}/${this.maxReconnectAttempts})`)
    
    setTimeout(async () => {
      try {
        await this.connectToExchange(exchangeId)
        console.log(`✅ 交易所 ${exchangeId} 重连成功`)
      } catch (error) {
        console.error(`❌ 交易所 ${exchangeId} 重连失败:`, error)
      }
    }, delay)
  }

  /**
   * Cleanup socket subscriptions
   */
  private cleanupSocketSubscriptions(socket: any): void {
    // Remove socket from all subscriptions
    for (const [key, sockets] of this.subscribedSymbols.entries()) {
      sockets.delete(socket.id)
      if (sockets.size === 0) {
        this.subscribedSymbols.delete(key)
      }
    }
  }

  /**
   * Get subscribed symbols for kline
   */
  private getSubscribedSymbolsForKline(exchangeId: string, timeframe: string): string[] {
    const symbols: string[] = []
    if (this.io) {
      const rooms = this.io.sockets.adapter.rooms
      for (const [room, _] of rooms.entries()) {
        if (room.startsWith(`${exchangeId}:`) && room.endsWith(`:${timeframe}`)) {
          const symbol = room.split(':')[1]
          symbols.push(symbol)
        }
      }
    }
    return symbols
  }

  /**
   * Get subscribed symbols for orderbook
   */
  private getSubscribedSymbolsForOrderBook(exchangeId: string): string[] {
    const symbols: string[] = []
    if (this.io) {
      const rooms = this.io.sockets.adapter.rooms
      for (const [room, _] of rooms.entries()) {
        if (room.startsWith(`${exchangeId}:`) && room.endsWith(':orderbook')) {
          const symbol = room.split(':')[1]
          symbols.push(symbol)
        }
      }
    }
    return symbols
  }

  /**
   * Get subscribed symbols for trades
   */
  private getSubscribedSymbolsForTrades(exchangeId: string): string[] {
    const symbols: string[] = []
    if (this.io) {
      const rooms = this.io.sockets.adapter.rooms
      for (const [room, _] of rooms.entries()) {
        if (room.startsWith(`${exchangeId}:`) && room.endsWith(':trades')) {
          const symbol = room.split(':')[1]
          symbols.push(symbol)
        }
      }
    }
    return symbols
  }

  /**
   * Get WebSocket server instance
   */
  getIOServer(): SocketIOServer | null {
    return this.io
  }
}