import React from 'react'
import { RealTimePriceTicker } from '../components/RealTimePriceTicker'
import { RealTimeKlineChart } from '../components/RealTimeKlineChart'
import { RealTimeOrderBook } from '../components/RealTimeOrderBook'
import { RealTimeTrades } from '../components/RealTimeTrades'
import StrategySignalNotification from '../components/SignalNotification'

export const RealTimeDemo: React.FC = () => {
  const demoSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
  const demoExchange = 'binance'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            实时数据演示
          </h1>
          <p className="text-gray-600">
            展示WebSocket实时数据流功能：价格、K线、订单簿、交易记录和策略信号
          </p>
        </div>

        {/* 实时价格显示 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">实时价格</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoSymbols.map((symbol) => (
              <RealTimePriceTicker
                key={symbol}
                symbol={symbol}
                exchange={demoExchange}
                className="shadow-sm"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 实时K线图表 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实时K线图表</h2>
            <RealTimeKlineChart
              symbol="BTC/USDT"
              exchange={demoExchange}
              interval="1m"
              className="shadow-sm h-96"
            />
          </div>

          {/* 实时订单簿 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实时订单簿</h2>
            <RealTimeOrderBook
              symbol="BTC/USDT"
              exchange={demoExchange}
              className="shadow-sm"
              depth={15}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 实时交易记录 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实时交易记录</h2>
            <RealTimeTrades
              symbol="BTC/USDT"
              exchange={demoExchange}
              className="shadow-sm"
              maxTrades={30}
            />
          </div>

          {/* 策略信号通知 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">策略信号</h2>
            <StrategySignalNotification
              className="shadow-sm"
              maxSignals={8}
            />
          </div>
        </div>

        {/* 连接状态 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-800">
              WebSocket连接正常 - 实时数据流已激活
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            数据更新频率：价格(实时) | K线(1分钟) | 订单簿(实时) | 交易(实时) | 策略信号(触发时)
          </p>
        </div>
      </div>
    </div>
  )
}