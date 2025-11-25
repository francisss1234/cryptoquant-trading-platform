import React, { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const WebSocketTest: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [receivedMessages, setReceivedMessages] = useState<string[]>([])

  useEffect(() => {
    // 创建Socket连接
    const newSocket = io('http://localhost:3003', {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      setTestMessage('连接成功！')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      setTestMessage(`错误: ${error.message}`)
    })

    // 监听测试消息
    newSocket.on('test', (data) => {
      console.log('Received test message:', data)
      setReceivedMessages(prev => [...prev, JSON.stringify(data)])
    })

    // 监听价格更新
    newSocket.on('price_update', (data) => {
      console.log('Price update:', data)
      setReceivedMessages(prev => [...prev, `价格更新: ${JSON.stringify(data)}`])
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const sendTestMessage = () => {
    if (socket) {
      socket.emit('test', { message: 'Hello from client!', timestamp: Date.now() })
      setTestMessage('测试消息已发送')
    }
  }

  const subscribeToPrice = () => {
    if (socket) {
      socket.emit('subscribe', { type: 'price', symbol: 'BTC/USDT' })
      setTestMessage('已订阅BTC/USDT价格')
    }
  }

  const clearMessages = () => {
    setReceivedMessages([])
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">WebSocket连接测试</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">连接状态</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
        
        {testMessage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
            <p className="text-sm text-blue-800">{testMessage}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={sendTestMessage}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            发送测试消息
          </button>
          
          <button
            onClick={subscribeToPrice}
            disabled={!isConnected}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            订阅价格
          </button>
          
          <button
            onClick={clearMessages}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            清除消息
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">接收到的消息</h2>
          <span className="text-sm text-gray-500">{receivedMessages.length} 条消息</span>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {receivedMessages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无消息</p>
          ) : (
            receivedMessages.map((message, index) => (
              <div key={index} className="p-3 bg-gray-50 border rounded-md">
                <p className="text-sm text-gray-800 font-mono">{message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">测试说明</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 点击"发送测试消息"向服务器发送测试数据</li>
          <li>• 点击"订阅价格"订阅BTC/USDT价格更新</li>
          <li>• 查看控制台日志获取详细的WebSocket通信信息</li>
          <li>• 如果连接失败，请检查服务器是否正常运行</li>
        </ul>
      </div>
    </div>
  )
}