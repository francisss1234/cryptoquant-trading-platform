import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { RealTimeData } from '../hooks/useWebSocket'

interface RealTimePriceTickerProps {
  symbol: string
  exchange?: string
  className?: string
}

export const RealTimePriceTicker: React.FC<RealTimePriceTickerProps> = ({
  symbol,
  exchange = 'binance',
  className = ''
}) => {
  const { priceData, subscribe, unsubscribe } = useWebSocket()
  const [currentPrice, setCurrentPrice] = useState<RealTimeData | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0)

  useEffect(() => {
    const symbolKey = `${exchange}:${symbol}`
    
    // 订阅价格数据
    subscribe('price', symbolKey)

    return () => {
      unsubscribe('price', symbolKey)
    }
  }, [symbol, exchange, subscribe, unsubscribe])

  useEffect(() => {
    const symbolKey = `${exchange}:${symbol}`
    const data = priceData.get(symbolKey)
    
    if (data) {
      setCurrentPrice(data)
      
      // 计算价格变化
      if (data.open && data.close) {
        const change = data.close - data.open
        const changePercent = (change / data.open) * 100
        setPriceChange(change)
        setPriceChangePercent(changePercent)
      }
    }
  }, [priceData, symbol, exchange])

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

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return sign + change.toFixed(2)
  }

  const formatChangePercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return sign + percent.toFixed(2) + '%'
  }

  if (!currentPrice) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    )
  }

  const isPositive = priceChange >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className={`flex items-center space-x-4 p-4 rounded-lg border ${bgColor} ${className}`}>
      <div className="flex-1">
        <div className="text-sm text-gray-600 mb-1">{symbol.toUpperCase()}</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(currentPrice.close)}
        </div>
      </div>
      
      <div className="text-right">
        <div className={`text-lg font-semibold ${changeColor} flex items-center`}>
          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {formatChange(priceChange)}
        </div>
        <div className={`text-sm ${changeColor}`}>
          {formatChangePercent(priceChangePercent)}
        </div>
      </div>
    </div>
  )
}