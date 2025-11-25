import React, { useEffect, useState } from 'react'
import { Bell, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useWebSocket, SignalData } from '../hooks/useWebSocket'

interface StrategySignalNotificationProps {
  strategyId?: string
  className?: string
  maxSignals?: number
}

interface SignalNotification extends SignalData {
  id: string
  timestamp: number
  isRead: boolean
  type: 'BUY' | 'SELL' | 'HOLD' | 'ALERT' // Add type property for component compatibility
}

export const StrategySignalNotification: React.FC<StrategySignalNotificationProps> = ({
  strategyId,
  className = '',
  maxSignals = 10
}) => {
  const { signals, subscribe, unsubscribe } = useWebSocket()
  const [notifications, setNotifications] = useState<SignalNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const signalKey = strategyId ? `strategy:${strategyId}` : 'signals'
    subscribe('signals', signalKey)

    return () => {
      unsubscribe('signals', signalKey)
    }
  }, [strategyId, subscribe, unsubscribe])

  useEffect(() => {
    if (signals.length > 0) {
      const newNotifications = signals.map(signal => ({
        ...signal,
        id: `${signal.strategyId}-${signal.timestamp}-${Math.random()}`,
        timestamp: signal.timestamp,
        isRead: false,
        type: signal.signal // Map signal to type for component compatibility
      }))
      
      setNotifications(prev => {
        const combined = [...newNotifications, ...prev]
        const limited = combined.slice(0, maxSignals)
        return limited
      })
      
      setUnreadCount(prev => prev + newNotifications.length)
    }
  }, [signals, maxSignals])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <Bell className="w-5 h-5 text-blue-600" />
    }
  }

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'border-green-200 bg-green-50'
      case 'sell':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}秒前`
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else {
      return new Date(timestamp).toLocaleTimeString('zh-CN')
    }
  }

  if (notifications.length === 0) {
    return (
      <div className={`bg-white rounded-lg border ${className}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">策略信号</span>
          </div>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>暂无策略信号</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">策略信号</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
              getSignalColor(notification.type)
            } ${
              !notification.isRead ? 'border-l-4' : ''
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start space-x-3">
              {getSignalIcon(notification.type)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.strategyName || notification.strategyId}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mt-1">
                  {notification.message}
                </p>
                
                {notification.data && (
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>价格: {notification.data.price}</span>
                      <span>数量: {notification.data.amount}</span>
                    </div>
                  </div>
                )}
                
                {!notification.isRead && (
                  <div className="mt-1">
                    <span className="text-xs text-blue-600 font-medium">未读</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StrategySignalNotification;