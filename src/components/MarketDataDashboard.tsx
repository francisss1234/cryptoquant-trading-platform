import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Download, BarChart3, Activity } from 'lucide-react';
import { useMarketDataStore } from '../stores/marketDataStore';
import { KlineChart } from './KlineChart';
import { OrderBook } from './OrderBook';
import { TechnicalIndicators } from './TechnicalIndicators';

const EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'okx', label: 'OKX' },
  { value: 'kraken', label: 'Kraken' }
];

const SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT',
  'XRP/USDT', 'DOT/USDT', 'AVAX/USDT', 'MATIC/USDT', 'ATOM/USDT'
];

const TIMEFRAMES = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
  { value: '1w', label: '1周' }
];

export const MarketDataDashboard: React.FC = () => {
  const {
    selectedExchange,
    selectedSymbol,
    selectedTimeframe,
    marketData,
    klineData,
    orderBookData,
    isLoading,
    error,
    setSelectedExchange,
    setSelectedSymbol,
    setSelectedTimeframe,
    fetchTicker,
    fetchKlineData,
    fetchOrderBook,
    syncHistoricalData
  } = useMarketDataStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'indicators' | 'orderbook'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTicker(selectedExchange, selectedSymbol);
      fetchOrderBook(selectedExchange, selectedSymbol);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedExchange, selectedSymbol, fetchTicker, fetchOrderBook]);

  // 初始加载
  useEffect(() => {
    fetchTicker(selectedExchange, selectedSymbol);
    fetchKlineData(selectedExchange, selectedSymbol, selectedTimeframe);
    fetchOrderBook(selectedExchange, selectedSymbol);
  }, [selectedExchange, selectedSymbol, selectedTimeframe]);

  const currentMarketData = marketData[selectedSymbol];
  const currentKlineData = klineData[selectedSymbol] || [];
  const currentOrderBook = orderBookData[selectedSymbol];

  const handleRefresh = () => {
    fetchTicker(selectedExchange, selectedSymbol);
    fetchKlineData(selectedExchange, selectedSymbol, selectedTimeframe);
    fetchOrderBook(selectedExchange, selectedSymbol);
  };

  const handleSyncData = async () => {
    await syncHistoricalData(selectedExchange, selectedSymbol, selectedTimeframe);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数字货币市场数据</h1>
          <p className="text-gray-600">实时监控和分析数字货币市场数据</p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易所
              </label>
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXCHANGES.map(exchange => (
                  <option key={exchange.value} value={exchange.value}>
                    {exchange.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易对
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SYMBOLS.map(symbol => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间周期
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                自动刷新
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSyncData}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              同步历史数据
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: '概览', icon: BarChart3 },
                { id: 'chart', label: 'K线图', icon: TrendingUp },
                { id: 'indicators', label: '技术指标', icon: Activity },
                { id: 'orderbook', label: '订单簿', icon: TrendingDown }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* 概览标签 */}
            {activeTab === 'overview' && currentMarketData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">当前价格</h3>
                  <p className="text-2xl font-bold mt-2">
                    {formatPrice(currentMarketData.price)}
                  </p>
                  <p className={`text-sm mt-1 flex items-center ${
                    currentMarketData.change24h >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {currentMarketData.change24h >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {formatPercentage(currentMarketData.change24h)}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">24小时最高价</h3>
                  <p className="text-2xl font-bold mt-2">
                    {formatPrice(currentMarketData.high24h)}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">24小时最低价</h3>
                  <p className="text-2xl font-bold mt-2">
                    {formatPrice(currentMarketData.low24h)}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">24小时成交量</h3>
                  <p className="text-2xl font-bold mt-2">
                    {currentMarketData.volume24h.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* K线图标签 */}
            {activeTab === 'chart' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedSymbol} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label} K线图
                </h3>
                <KlineChart 
                  data={currentKlineData} 
                  symbol={selectedSymbol}
                  timeframe={selectedTimeframe}
                />
              </div>
            )}

            {/* 技术指标标签 */}
            {activeTab === 'indicators' && (
              <TechnicalIndicators />
            )}

            {/* 订单簿标签 */}
            {activeTab === 'orderbook' && currentOrderBook && (
              <OrderBook 
                bids={currentOrderBook.bids}
                asks={currentOrderBook.asks}
                symbol={selectedSymbol}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};