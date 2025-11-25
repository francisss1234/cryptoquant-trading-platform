import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

export interface RealTimeData {
  symbol: string
  price: number
  timestamp: number
  volume?: number
  change?: number
  changePercent?: number
  open?: number
  close?: number
  high?: number
  low?: number
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
  id?: string
}

export interface SignalData {
  strategyId: string
  strategyName?: string
  symbol: string
  signal: 'BUY' | 'SELL' | 'HOLD' | 'ALERT'
  price: number
  strength: number
  timestamp: number
  metadata?: any
  message?: string
  data?: {
    price: number
    amount: number
  }
}

interface WebSocketState {
  socket: Socket | null
  isConnected: boolean
  subscribedSymbols: Set<string>
  subscribedKlines: Set<string>
  subscribedOrderBooks: Set<string>
  subscribedTrades: Set<string>
  subscribedStrategies: Set<string>
  subscribedPortfolio: boolean
  
  // Real-time data
  priceData: Map<string, RealTimeData>
  klineData: Map<string, KlineData[]>
  orderBookData: Map<string, OrderBookData>
  tradeData: Map<string, TradeData[]>
  signals: SignalData[]
  orderUpdates: any[]
  
  // Actions
  connect: () => void
  disconnect: () => void
  subscribeSymbol: (symbol: string, exchange: string) => void
  unsubscribeSymbol: (symbol: string, exchange: string) => void
  subscribeKline: (symbol: string, timeframe: string, exchange: string) => void
  unsubscribeKline: (symbol: string, timeframe: string, exchange: string) => void
  subscribeOrderBook: (symbol: string, exchange: string) => void
  unsubscribeOrderBook: (symbol: string, exchange: string) => void
  subscribeTrades: (symbol: string, exchange: string) => void
  unsubscribeTrades: (symbol: string, exchange: string) => void
  subscribeStrategy: (strategyId: string) => void
  unsubscribeStrategy: (strategyId: string) => void
  subscribePortfolio: () => void
  subscribeOrders: (userId: string) => void
  unsubscribeOrders: (userId: string) => void
  
  // Convenience methods
  subscribe: (type: string, params: any) => void
  unsubscribe: (type: string, params: any) => void
  
  // Data getters
  getPriceData: (symbol: string) => RealTimeData | undefined
  getKlineData: (symbol: string, timeframe: string) => KlineData[]
  getOrderBookData: (symbol: string) => OrderBookData | undefined
  getTradeData: (symbol: string) => TradeData[]
  getSignals: () => SignalData[]
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  subscribedSymbols: new Set(),
  subscribedKlines: new Set(),
  subscribedOrderBooks: new Set(),
  subscribedTrades: new Set(),
  subscribedStrategies: new Set(),
  subscribedPortfolio: false,
  
  priceData: new Map(),
  klineData: new Map(),
  orderBookData: new Map(),
  tradeData: new Map(),
  signals: [],
  orderUpdates: [],

  connect: () => {
    const { socket, isConnected } = get()
    
    if (socket?.connected || isConnected) {
      console.log('WebSocket already connected')
      return
    }

    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    })

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected')
      set({ isConnected: true, socket: newSocket })
      
      // Resubscribe to previous subscriptions
      const state = get()
      state.subscribedSymbols.forEach(subscription => {
        const [exchange, symbol] = subscription.split(':')
        newSocket.emit('subscribe_symbol', { symbol, exchange })
      })
      
      state.subscribedKlines.forEach(subscription => {
        const [exchange, symbol, timeframe] = subscription.split(':')
        newSocket.emit('subscribe_kline', { symbol, timeframe, exchange })
      })
      
      state.subscribedOrderBooks.forEach(subscription => {
        const [exchange, symbol] = subscription.split(':')
        newSocket.emit('subscribe_orderbook', { symbol, exchange })
      })
      
      state.subscribedTrades.forEach(subscription => {
        const [exchange, symbol] = subscription.split(':')
        newSocket.emit('subscribe_trades', { symbol, exchange })
      })
      
      state.subscribedStrategies.forEach(strategyId => {
        newSocket.emit('subscribe_strategy', { strategyId })
      })
      
      if (state.subscribedPortfolio) {
        newSocket.emit('subscribe_portfolio', {})
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log(`❌ WebSocket disconnected: ${reason}`)
      set({ isConnected: false })
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      set({ isConnected: false })
    })

    // Price updates
    newSocket.on('price_update', (data: RealTimeData) => {
      set((state) => ({
        priceData: new Map(state.priceData).set(data.symbol, data)
      }))
    })

    // Kline updates
    newSocket.on('kline_update', (data: KlineData) => {
      set((state) => {
        const key = `${data.symbol}:${data.timeframe}`
        const existingData = state.klineData.get(key) || []
        const newData = [...existingData, data].slice(-100) // Keep last 100 candles
        
        return {
          klineData: new Map(state.klineData).set(key, newData)
        }
      })
    })

    // Orderbook updates
    newSocket.on('orderbook_update', (data: OrderBookData) => {
      set((state) => ({
        orderBookData: new Map(state.orderBookData).set(data.symbol, data)
      }))
    })

    // Trade updates
    newSocket.on('trade_update', (data: TradeData) => {
      set((state) => {
        const existingData = state.tradeData.get(data.symbol) || []
        const newData = [data, ...existingData].slice(0, 50) // Keep last 50 trades
        
        return {
          tradeData: new Map(state.tradeData).set(data.symbol, newData)
        }
      })
    })

    // Trading signals
    newSocket.on('trading_signal', (data: SignalData) => {
      set((state) => ({
        signals: [data, ...state.signals].slice(0, 10) // Keep last 10 signals
      }))
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`交易信号: ${data.signal}`, {
          body: `${data.symbol} - ${data.signal} @ $${data.price.toFixed(2)}`,
          icon: '/favicon.ico'
        })
      }
    })

    // Order updates
    newSocket.on('order_update', (data: any) => {
      console.log('📈 订单更新:', data)
      // Handle order status updates
    })

    // Portfolio updates
    newSocket.on('portfolio_update', (data: any) => {
      console.log('💼 投资组合更新:', data)
      // Handle portfolio updates
    })

    // Subscription confirmations
    newSocket.on('subscription_confirmed', (data: any) => {
      console.log('✅ 订阅确认:', data)
    })

    set({ socket: newSocket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ 
        socket: null, 
        isConnected: false,
        priceData: new Map(),
        klineData: new Map(),
        orderBookData: new Map(),
        tradeData: new Map(),
        signals: []
      })
    }
  },

  subscribeSymbol: (symbol: string, exchange: string) => {
    const { socket, subscribedSymbols } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}`
    if (subscribedSymbols.has(subscriptionKey)) return

    socket.emit('subscribe_symbol', { symbol, exchange })
    set({ subscribedSymbols: new Set(subscribedSymbols).add(subscriptionKey) })
  },

  unsubscribeSymbol: (symbol: string, exchange: string) => {
    const { socket, subscribedSymbols } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}`
    socket.emit('unsubscribe_symbol', { symbol, exchange })
    
    const newSubscribedSymbols = new Set(subscribedSymbols)
    newSubscribedSymbols.delete(subscriptionKey)
    set({ subscribedSymbols: newSubscribedSymbols })
  },

  subscribeKline: (symbol: string, timeframe: string, exchange: string) => {
    const { socket, subscribedKlines } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}:${timeframe}`
    if (subscribedKlines.has(subscriptionKey)) return

    socket.emit('subscribe_kline', { symbol, timeframe, exchange })
    set({ subscribedKlines: new Set(subscribedKlines).add(subscriptionKey) })
  },

  unsubscribeKline: (symbol: string, timeframe: string, exchange: string) => {
    const { socket, subscribedKlines } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}:${timeframe}`
    if (!subscribedKlines.has(subscriptionKey)) return

    socket.emit('unsubscribe_kline', { symbol, timeframe, exchange })
    const newSubscribedKlines = new Set(subscribedKlines)
    newSubscribedKlines.delete(subscriptionKey)
    set({ subscribedKlines: newSubscribedKlines })
  },

  subscribeOrderBook: (symbol: string, exchange: string) => {
    const { socket, subscribedOrderBooks } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}`
    if (subscribedOrderBooks.has(subscriptionKey)) return

    socket.emit('subscribe_orderbook', { symbol, exchange })
    set({ subscribedOrderBooks: new Set(subscribedOrderBooks).add(subscriptionKey) })
  },

  unsubscribeOrderBook: (symbol: string, exchange: string) => {
    const { socket, subscribedOrderBooks } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}`
    if (!subscribedOrderBooks.has(subscriptionKey)) return

    socket.emit('unsubscribe_orderbook', { symbol, exchange })
    const newSubscribedOrderBooks = new Set(subscribedOrderBooks)
    newSubscribedOrderBooks.delete(subscriptionKey)
    set({ subscribedOrderBooks: newSubscribedOrderBooks })
  },

  subscribeTrades: (symbol: string, exchange: string) => {
    const { socket, subscribedTrades } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}`
    if (subscribedTrades.has(subscriptionKey)) return

    socket.emit('subscribe_trades', { symbol, exchange })
    set({ subscribedTrades: new Set(subscribedTrades).add(subscriptionKey) })
  },

  unsubscribeTrades: (symbol: string, exchange: string) => {
    const { socket, subscribedTrades } = get()
    if (!socket?.connected) return

    const subscriptionKey = `${exchange}:${symbol}`
    if (!subscribedTrades.has(subscriptionKey)) return

    socket.emit('unsubscribe_trades', { symbol, exchange })
    const newSubscribedTrades = new Set(subscribedTrades)
    newSubscribedTrades.delete(subscriptionKey)
    set({ subscribedTrades: newSubscribedTrades })
  },

  subscribeStrategy: (strategyId: string) => {
    const { socket, subscribedStrategies } = get()
    if (!socket?.connected) return

    if (subscribedStrategies.has(strategyId)) return

    socket.emit('subscribe_strategy', { strategyId })
    set({ subscribedStrategies: new Set(subscribedStrategies).add(strategyId) })
  },

  unsubscribeStrategy: (strategyId: string) => {
    const { socket, subscribedStrategies } = get()
    if (!socket?.connected) return

    if (!subscribedStrategies.has(strategyId)) return

    socket.emit('unsubscribe_strategy', { strategyId })
    const newSubscribedStrategies = new Set(subscribedStrategies)
    newSubscribedStrategies.delete(strategyId)
    set({ subscribedStrategies: newSubscribedStrategies })
  },

  subscribePortfolio: () => {
    const { socket, subscribedPortfolio } = get()
    if (!socket?.connected) return

    if (subscribedPortfolio) return

    socket.emit('subscribe_portfolio', {})
    set({ subscribedPortfolio: true })
  },

  getPriceData: (symbol: string) => {
    return get().priceData.get(symbol)
  },

  getKlineData: (symbol: string, timeframe: string) => {
    const key = `${symbol}:${timeframe}`
    return get().klineData.get(key) || []
  },

  getOrderBookData: (symbol: string) => {
    return get().orderBookData.get(symbol)
  },

  getTradeData: (symbol: string) => {
    return get().tradeData.get(symbol) || []
  },

  getSignals: () => {
    return get().signals
  },
  
  subscribeOrders: (userId: string) => {
    const { socket } = get()
    if (!socket?.connected) return
    
    socket.emit('subscribe_orders', { userId })
  },
  
  unsubscribeOrders: (userId: string) => {
    const { socket } = get()
    if (!socket?.connected) return
    
    socket.emit('unsubscribe_orders', { userId })
  },
  
  subscribe: (type: string, params: any) => {
    const { socket } = get()
    if (!socket?.connected) return
    
    switch (type) {
      case 'price':
        get().subscribeSymbol(params.symbol, params.exchange)
        break
      case 'kline':
        get().subscribeKline(params.symbol, params.timeframe, params.exchange)
        break
      case 'orderbook':
        get().subscribeOrderBook(params.symbol, params.exchange)
        break
      case 'trades':
        get().subscribeTrades(params.symbol, params.exchange)
        break
      case 'signals':
        get().subscribeStrategy(params.strategyId)
        break
      case 'orders':
        get().subscribeOrders(params.userId)
        break
      case 'portfolio':
        get().subscribePortfolio()
        break
    }
  },
  
  unsubscribe: (type: string, params: any) => {
    const { socket } = get()
    if (!socket?.connected) return
    
    switch (type) {
      case 'price':
        get().unsubscribeSymbol(params.symbol, params.exchange)
        break
      case 'kline':
        get().unsubscribeKline(params.symbol, params.timeframe, params.exchange)
        break
      case 'orderbook':
        get().unsubscribeOrderBook(params.symbol, params.exchange)
        break
      case 'trades':
        get().unsubscribeTrades(params.symbol, params.exchange)
        break
      case 'signals':
        get().unsubscribeStrategy(params.strategyId)
        break
      case 'orders':
        get().unsubscribeOrders(params.userId)
        break
    }
  }
}))

// Request notification permission on mount
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}

// Auto-connect on store creation
export const initializeWebSocket = () => {
  const { connect } = useWebSocketStore.getState()
  connect()
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  const { disconnect } = useWebSocketStore.getState()
  disconnect()
})

// Custom hook for easy access
export const useWebSocket = () => {
  const store = useWebSocketStore()
  
  return {
    // Connection state
    socket: store.socket,
    isConnected: store.isConnected,
    
    // Data getters
    priceData: store.priceData,
    klineData: store.klineData,
    orderBookData: store.orderBookData,
    tradeData: store.tradeData,
    signals: store.signals,
    orderUpdates: store.orderUpdates,
    
    // Subscription methods
    subscribeToPrice: store.subscribeSymbol,
    unsubscribeFromPrice: store.unsubscribeSymbol,
    subscribeToKline: store.subscribeKline,
    unsubscribeFromKline: store.unsubscribeKline,
    subscribeToOrderBook: store.subscribeOrderBook,
    unsubscribeFromOrderBook: store.unsubscribeOrderBook,
    subscribeToTrades: store.subscribeTrades,
    unsubscribeFromTrades: store.unsubscribeTrades,
    subscribeToSignals: store.subscribeStrategy,
    unsubscribeFromSignals: store.unsubscribeStrategy,
    subscribeToOrders: store.subscribeOrders,
    unsubscribeFromOrders: store.unsubscribeOrders,
    
    // Convenience methods
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
    
    // Connection methods
    connect: store.connect,
    disconnect: store.disconnect
  }
}