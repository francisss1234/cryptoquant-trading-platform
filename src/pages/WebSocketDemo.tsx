import React from 'react';
import { RealTimePriceTicker } from '@/components/RealTimePriceTicker';
import { RealTimeKlineChart } from '@/components/RealTimeKlineChart';
import { RealTimeOrderBook } from '@/components/RealTimeOrderBook';
import { RealTimeOrderStatus } from '@/components/RealTimeOrderStatus';
import { RealTimeStrategySignals } from '@/components/RealTimeStrategySignals';
import { Zap, Activity, BarChart3, TrendingUp } from 'lucide-react';

export const WebSocketDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              WebSocket实时数据演示
            </h1>
          </div>
          <p className="text-gray-600">
            体验CryptoQuant平台的实时数据流功能 - 价格、K线、订单簿、订单状态和策略信号
          </p>
        </div>

        {/* Real-time Price Tickers */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">实时价格</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RealTimePriceTicker symbol="BTC/USDT" exchange="binance" />
            <RealTimePriceTicker symbol="ETH/USDT" exchange="binance" />
            <RealTimePriceTicker symbol="SOL/USDT" exchange="binance" />
          </div>
        </div>

        {/* Real-time K-line Charts */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">实时K线图表</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeKlineChart 
              symbol="BTC/USDT" 
              exchange="binance" 
              interval="1m"
              className="h-96"
            />
            <RealTimeKlineChart 
              symbol="ETH/USDT" 
              exchange="binance" 
              interval="5m"
              className="h-96"
            />
          </div>
        </div>

        {/* Real-time Order Book */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">实时订单簿</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeOrderBook 
              symbol="BTC/USDT" 
              exchange="binance" 
              depth={15}
            />
            <RealTimeOrderBook 
              symbol="ETH/USDT" 
              exchange="binance" 
              depth={15}
            />
          </div>
        </div>

        {/* Real-time Order Status */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">实时订单状态</h2>
          </div>
          <RealTimeOrderStatus userId="demo-user" />
        </div>

        {/* Real-time Strategy Signals */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">实时策略信号</h2>
          </div>
          <RealTimeStrategySignals 
            strategyId="demo-strategy"
            enableNotifications={true}
          />
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">连接状态</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">WebSocket连接</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">实时数据流</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">订单推送</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">信号通知</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};