import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { useIndicatorStore } from '../stores/indicatorStore';
import { useMarketDataStore } from '../stores/marketDataStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INDICATOR_TYPES = [
  { value: 'SMA', label: '简单移动平均线', category: '趋势指标' },
  { value: 'EMA', label: '指数移动平均线', category: '趋势指标' },
  { value: 'RSI', label: '相对强弱指标', category: '动量指标' },
  { value: 'MACD', label: 'MACD指标', category: '趋势指标' },
  { value: 'BOLL', label: '布林带', category: '波动性指标' },
  { value: 'STOCH', label: '随机指标', category: '动量指标' },
  { value: 'ATR', label: '平均真实波幅', category: '波动性指标' },
  { value: 'VWAP', label: '成交量加权平均价格', category: '成交量指标' },
  { value: 'MOM', label: '动量指标', category: '动量指标' }
];

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export const TechnicalIndicators: React.FC = () => {
  const {
    indicators,
    indicatorResults,
    isLoading,
    error,
    addIndicator,
    removeIndicator,
    updateIndicator,
    fetchMultipleIndicators
  } = useIndicatorStore();

  const {
    selectedExchange,
    selectedSymbol,
    selectedTimeframe,
    klineData
  } = useMarketDataStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newIndicator, setNewIndicator] = useState({
    name: '',
    type: 'SMA',
    parameters: { period: 20 },
    color: COLORS[0]
  });

  // 当市场数据变化时重新计算指标
  useEffect(() => {
    const currentKlineData = klineData[selectedSymbol];
    if (currentKlineData && currentKlineData.length > 0) {
      fetchMultipleIndicators(selectedExchange, selectedSymbol, selectedTimeframe);
    }
  }, [klineData, selectedExchange, selectedSymbol, selectedTimeframe]);

  const handleAddIndicator = () => {
    if (!newIndicator.name.trim()) {
      alert('请输入指标名称');
      return;
    }

    addIndicator({
      name: newIndicator.name,
      type: newIndicator.type,
      parameters: newIndicator.parameters,
      color: newIndicator.color,
      isActive: true
    });

    setNewIndicator({
      name: '',
      type: 'SMA',
      parameters: { period: 20 },
      color: COLORS[indicators.length % COLORS.length]
    });
    setShowAddModal(false);
  };

  const prepareChartData = () => {
    const currentKlineData = klineData[selectedSymbol];
    if (!currentKlineData || currentKlineData.length === 0) return [];

    return currentKlineData.map((candle, index) => {
      const dataPoint: any = {
        timestamp: new Date(candle.timestamp).toLocaleString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        close: candle.close
      };

      // 添加每个指标的值
      indicators.forEach(indicator => {
        const results = indicatorResults[indicator.id];
        if (results && results[index]) {
          dataPoint[indicator.name] = results[index].value;
        }
      });

      return dataPoint;
    }).reverse();
  };

  const chartData = prepareChartData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">技术指标分析</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedSymbol} - {selectedTimeframe} 周期
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加指标
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 指标列表 */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">已配置的指标</h4>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {indicators.map(indicator => (
              <div key={indicator.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: indicator.color }}
                  />
                  <div>
                    <h5 className="font-medium text-gray-900">{indicator.name}</h5>
                    <p className="text-sm text-gray-600">
                      {INDICATOR_TYPES.find(t => t.value === indicator.type)?.label}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeIndicator(indicator.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">指标图表</h4>
        </div>
        <div className="p-6">
          <div className="h-96">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="timestamp" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  
                  {/* 价格线 */}
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#374151" 
                    strokeWidth={2}
                    name="收盘价"
                    dot={false}
                  />
                  
                  {/* 指标线 */}
                  {indicators.map(indicator => {
                    const results = indicatorResults[indicator.id];
                    if (!results || results.length === 0) return null;
                    
                    return (
                      <Line 
                        key={indicator.id}
                        type="monotone" 
                        dataKey={indicator.name} 
                        stroke={indicator.color} 
                        strokeWidth={2}
                        name={indicator.name}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">暂无数据</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加指标模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加技术指标</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指标名称
                </label>
                <input
                  type="text"
                  value={newIndicator.name}
                  onChange={(e) => setNewIndicator({...newIndicator, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: MA20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指标类型
                </label>
                <select
                  value={newIndicator.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    let defaultParams: any = { period: 20 };
                    
                    // 设置默认参数
                    switch (type) {
                      case 'SMA':
                      case 'EMA':
                        defaultParams = { period: 20 };
                        break;
                      case 'RSI':
                      case 'STOCH':
                      case 'ATR':
                        defaultParams = { period: 14 };
                        break;
                      case 'MACD':
                        defaultParams = { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
                        break;
                      case 'BOLL':
                        defaultParams = { period: 20, stdDev: 2 };
                        break;
                      case 'MOM':
                        defaultParams = { period: 10 };
                        break;
                    }
                    setNewIndicator({...newIndicator, type, parameters: defaultParams});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {INDICATOR_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色
                </label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewIndicator({...newIndicator, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newIndicator.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddIndicator}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};