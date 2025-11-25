import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maximumDrawdown: number;
  volatility: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  averageTradeReturn: number;
  var95: number;
  expectedShortfall: number;
  calmarRatio: number;
  sortinoRatio: number;
}

interface ChartData {
  date: string;
  value: number;
  cumulativeReturn?: number;
  drawdown?: number;
  volume?: number;
}

interface TradeDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface AssetAllocation {
  symbol: string;
  allocation: number;
  value: number;
  return: number;
}

interface HeatmapData {
  symbol: string;
  date: string;
  value: number;
}

interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
}

export const VisualizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'charts' | 'heatmap' | 'correlation'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tradeDistribution, setTradeDistribution] = useState<TradeDistribution[]>([]);
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  useEffect(() => {
    fetchPerformanceReport();
  }, [dateRange]);

  useEffect(() => {
    fetchHeatmapData();
    fetchCorrelationData();
  }, [selectedSymbol]);

  const fetchPerformanceReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = getStartDate(dateRange);
      const url = `/api/visualization/performance-report${startDate ? `?startDate=${startDate.toISOString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      setPerformanceMetrics(data.metrics);
      setChartData(data.chartData);
      setTradeDistribution(data.tradeDistribution);
      setAssetAllocation(data.assetAllocation);
    } catch (err) {
      setError('获取绩效报告失败');
      console.error('Error fetching performance report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch(`/api/visualization/heatmap?symbol=${selectedSymbol}`);
      const data = await response.json();
      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
    }
  };

  const fetchCorrelationData = async () => {
    try {
      const response = await fetch('/api/visualization/correlation');
      const data = await response.json();
      setCorrelationData(data);
    } catch (err) {
      console.error('Error fetching correlation data:', err);
    }
  };

  const getStartDate = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="text-red-700">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">错误</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">可视化分析</h1>
        <p className="text-gray-600">量化交易策略绩效分析与可视化展示</p>
      </div>

      {/* 控制面板 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">时间范围:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">7天</option>
              <option value="30d">30天</option>
              <option value="90d">90天</option>
              <option value="1y">1年</option>
              <option value="all">全部</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">交易对:</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPerformanceReport}
            className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            刷新数据
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: '概览' },
            { id: 'performance', name: '绩效指标' },
            { id: 'charts', name: '图表分析' },
            { id: 'heatmap', name: '热力图' },
            { id: 'correlation', name: '相关性' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 概览标签页 */}
      {activeTab === 'overview' && performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总收益率</p>
                <p className={`text-2xl font-semibold ${
                  performanceMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(performanceMetrics.totalReturn)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">年化收益率</p>
                <p className={`text-2xl font-semibold ${
                  performanceMetrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(performanceMetrics.annualizedReturn)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">夏普比率</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceMetrics.sharpeRatio.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">最大回撤</p>
                <p className="text-2xl font-semibold text-red-600">
                  {formatPercent(Math.abs(performanceMetrics.maximumDrawdown))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 绩效指标标签页 */}
      {activeTab === 'performance' && performanceMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细绩效指标</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">胜率</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPercent(performanceMetrics.winRate)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">盈亏比</span>
                <span className="text-sm font-semibold text-gray-900">
                  {performanceMetrics.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">总交易次数</span>
                <span className="text-sm font-semibold text-gray-900">
                  {performanceMetrics.totalTrades}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">平均交易收益</span>
                <span className={`text-sm font-semibold ${
                  performanceMetrics.averageTradeReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(performanceMetrics.averageTradeReturn)}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">波动率</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPercent(performanceMetrics.volatility)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">VaR (95%)</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatPercent(Math.abs(performanceMetrics.var95))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">预期亏损</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatPercent(Math.abs(performanceMetrics.expectedShortfall))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">卡尔马比率</span>
                <span className="text-sm font-semibold text-gray-900">
                  {performanceMetrics.calmarRatio.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">索提诺比率</span>
                <span className="text-sm font-semibold text-gray-900">
                  {performanceMetrics.sortinoRatio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图表分析标签页 */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* 累计收益图表 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">累计收益</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatPercent(value as number)} />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeReturn" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 回撤图表 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">回撤分析</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatPercent(value as number)} />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 交易分布 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">交易分布</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tradeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 资产配置 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">资产配置</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={assetAllocation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPercent(value as number)} />
                  <Bar dataKey="allocation" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 热力图标签页 */}
      {activeTab === 'heatmap' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            收益热力图 - {selectedSymbol}
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-full">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="text-xs text-center text-gray-500 p-1">
                  {hour}:00
                </div>
              ))}
              {heatmapData.map((data, index) => {
                const intensity = Math.abs(data.value);
                const isPositive = data.value >= 0;
                const opacity = Math.min(intensity * 2, 1);
                return (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium ${
                      isPositive 
                        ? `bg-green-500 text-white` 
                        : `bg-red-500 text-white`
                    }`}
                    style={{ opacity }}
                    title={`${data.date}: ${formatPercent(data.value)}`}
                  >
                    {data.value >= 0 ? '+' : ''}{(data.value * 100).toFixed(0)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 相关性标签页 */}
      {activeTab === 'correlation' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">资产相关性矩阵</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    资产
                  </th>
                  {symbols.map(symbol => (
                    <th key={symbol} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {symbol.split('/')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {symbols.map(symbol1 => (
                  <tr key={symbol1}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {symbol1.split('/')[0]}
                    </td>
                    {symbols.map(symbol2 => {
                      const correlation = correlationData.find(
                        d => d.symbol1 === symbol1 && d.symbol2 === symbol2
                      )?.correlation || 0;
                      const intensity = Math.abs(correlation);
                      const isPositive = correlation >= 0;
                      return (
                        <td key={symbol2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div
                            className={`px-2 py-1 rounded text-center font-medium ${
                              isPositive 
                                ? `bg-green-100 text-green-800` 
                                : `bg-red-100 text-red-800`
                            }`}
                            style={{ 
                              opacity: intensity,
                              backgroundColor: isPositive 
                                ? `rgba(34, 197, 94, ${intensity * 0.2})`
                                : `rgba(239, 68, 68, ${intensity * 0.2})`
                            }}
                          >
                            {correlation.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};