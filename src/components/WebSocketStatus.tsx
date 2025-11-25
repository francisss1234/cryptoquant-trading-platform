import React, { useEffect, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

export const WebSocketStatus: React.FC = () => {
  const { isConnected, priceData, klineData, orderBookData, tradeData, signals } = useWebSocket()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getDataStatus = (dataMap: Map<string, any>) => {
    const count = dataMap.size
    const hasRecentData = Array.from(dataMap.values()).some(data => {
      if (Array.isArray(data)) return data.length > 0
      return data && Object.keys(data).length > 0
    })
    
    return {
      count,
      hasRecentData,
      status: count > 0 ? (hasRecentData ? 'active' : 'connected') : 'waiting'
    }
  }

  const priceStatus = getDataStatus(priceData)
  const klineStatus = getDataStatus(klineData)
  const orderBookStatus = getDataStatus(orderBookData)
  const tradeStatus = getDataStatus(tradeData)
  const signalStatus = {
    count: signals.length,
    hasRecentData: signals.length > 0,
    status: signals.length > 0 ? 'active' : 'waiting'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'connected': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'waiting': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getConnectionColor = () => {
    return isConnected ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">WebSocket连接状态监控</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-lg border ${getConnectionColor()}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">WebSocket连接</h3>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <p className="text-sm mt-1">
            {isConnected ? '已连接' : '未连接'}
          </p>
          <p className="text-xs mt-2 text-gray-600">
            最后更新: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(priceStatus.status)}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">价格数据</h3>
            <span className="text-sm font-mono">{priceStatus.count}</span>
          </div>
          <p className="text-sm mt-1">
            {priceStatus.hasRecentData ? '有实时数据' : '等待数据中...'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(klineStatus.status)}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">K线数据</h3>
            <span className="text-sm font-mono">{klineStatus.count}</span>
          </div>
          <p className="text-sm mt-1">
            {klineStatus.hasRecentData ? '有实时数据' : '等待数据中...'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(orderBookStatus.status)}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">订单簿数据</h3>
            <span className="text-sm font-mono">{orderBookStatus.count}</span>
          </div>
          <p className="text-sm mt-1">
            {orderBookStatus.hasRecentData ? '有实时数据' : '等待数据中...'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(tradeStatus.status)}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">交易数据</h3>
            <span className="text-sm font-mono">{tradeStatus.count}</span>
          </div>
          <p className="text-sm mt-1">
            {tradeStatus.hasRecentData ? '有实时数据' : '等待数据中...'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(signalStatus.status)}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">策略信号</h3>
            <span className="text-sm font-mono">{signalStatus.count}</span>
          </div>
          <p className="text-sm mt-1">
            {signalStatus.hasRecentData ? '有实时信号' : '等待信号中...'}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">实时监控说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>绿色</strong>: 有活跃的实时数据更新</li>
          <li>• <strong>蓝色</strong>: 已连接但数据较少或连接中</li>
          <li>• <strong>黄色</strong>: 等待数据或连接不稳定</li>
          <li>• <strong>红色</strong>: WebSocket连接断开</li>
          <li>• 数据计数显示当前缓存的数据条目数量</li>
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold text-gray-900 mb-2">最近价格数据</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {Array.from(priceData.entries()).slice(-5).map(([key, data]) => (
              <div key={key} className="text-xs flex justify-between">
                <span className="text-gray-600">{key}</span>
                <span className="font-mono">${data.close?.toFixed(2) || data.price?.toFixed(2)}</span>
              </div>
            ))}
            {priceData.size === 0 && (
              <p className="text-gray-500 text-xs">暂无价格数据</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold text-gray-900 mb-2">最近策略信号</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {signals.slice(-5).map((signal, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">{signal.strategyName || signal.strategyId}</span>
                  <span className={`px-1 rounded text-xs ${
                    signal.signal === 'BUY' ? 'bg-green-100 text-green-800' :
                    signal.signal === 'SELL' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {signal.signal}
                  </span>
                </div>
                <p className="text-gray-700 mt-1">{signal.metadata?.message || '策略信号'}</p>
              </div>
            ))}
            {signals.length === 0 && (
              <p className="text-gray-500 text-xs">暂无策略信号</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}