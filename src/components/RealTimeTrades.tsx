import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { useWebSocket, TradeData } from '../hooks/useWebSocket'

interface RealTimeTradesProps {
  symbol: string
  exchange?: string
  className?: string
  maxTrades?: number
}

interface TradeDisplayData {
  id: string
  price: number
  amount: number
  side: 'buy' | 'sell'
  timestamp: number
  timeDisplay: string
}

export const RealTimeTrades: React.FC<RealTimeTradesProps> = ({
  symbol,
  exchange = 'binance',
  className = '',
  maxTrades = 50
}) => {
  const { tradeData, subscribe, unsubscribe } = useWebSocket()
  const [trades, setTrades] = useState<TradeDisplayData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const symbolKey = `${exchange}:${symbol}`
    
    // 订阅交易数据
    subscribe('trades', symbolKey)
    setIsConnected(true)

    return () => {
      unsubscribe('trades', symbolKey)
      setIsConnected(false)
    }
  }, [symbol, exchange, subscribe, unsubscribe])

  useEffect(() => {
    const symbolKey = `${exchange}:${symbol}`
    const tradesData = tradeData.get(symbolKey) || []
    
    if (tradesData.length > 0) {
      const displayTrades = tradesData.slice(-maxTrades).map((trade: TradeData) => ({
        id: trade.id || `${trade.timestamp}-${trade.price}-${trade.amount}`,
        price: trade.price,
        amount: trade.amount,
        side: trade.side || (trade.amount > 0 ? 'buy' : 'sell'),
        timestamp: trade.timestamp,
        timeDisplay: formatTime(trade.timestamp)
      }))
      
      setTrades(displayTrades.reverse()) // 最新的交易显示在最上面
    }
  }, [tradeData, symbol, exchange, maxTrades])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) { // 小于1分钟
      return `${Math.floor(diff / 1000)}秒前`
    } else if (diff < 3600000) { // 小于1小时
      return `${Math.floor(diff / 60000)}分钟前`
    } else {
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    } else if (price >= 1) {
      return price.toFixed(4)
    } else {
      return price.toFixed(8)
    }
  }

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount)
    if (absAmount >= 1000) {
      return `${(absAmount / 1000).toFixed(2)}K`
    }
    return absAmount.toFixed(4)
  }

  const getTradeIcon = (side: 'buy' | 'sell') => {
    return side === 'buy' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const getTradeColor = (side: 'buy' | 'sell') => {
    return side === 'buy' ? 'text-green-600' : 'text-red-600'
  }

  const getTradeBgColor = (side: 'buy' | 'sell') => {
    return side === 'buy' ? 'bg-green-50' : 'bg-red-50'
  }

  if (trades.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">
            {isConnected ? '等待交易数据...' : '连接中...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {symbol.toUpperCase()} 实时成交
          </h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {exchange.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-gray-600">买入</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span className="text-gray-600">卖出</span>
            </div>
          </div>
          <span className="text-gray-500">
            显示 {trades.length} 条交易
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {trades.map((trade) => (
          <div 
            key={trade.id}
            className={`flex items-center justify-between p-3 border-b hover:bg-gray-50 transition-colors ${getTradeBgColor(trade.side)}`}
          >
            <div className="flex items-center space-x-3">
              {getTradeIcon(trade.side)}
              <div>
                <div className={`font-semibold ${getTradeColor(trade.side)}`}>
                  {formatPrice(trade.price)}
                </div>
                <div className="text-sm text-gray-600">
                  {trade.timeDisplay}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${getTradeColor(trade.side)}`}>
                {trade.side === 'buy' ? '+' : '-'}{formatAmount(trade.amount)}
              </div>
              <div className="text-xs text-gray-500">
                {formatAmount(Math.abs(trade.amount) * trade.price)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? '已连接' : '未连接'}</span>
          </div>
          <span>实时更新中...</span>
        </div>
      </div>
    </div>
  )
}