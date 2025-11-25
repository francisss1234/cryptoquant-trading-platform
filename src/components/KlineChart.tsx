import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, BarChart } from 'recharts';
import { KlineData } from '../stores/marketDataStore';

interface KlineChartProps {
  data: KlineData[];
  symbol: string;
  timeframe: string;
}

interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const KlineChart: React.FC<KlineChartProps> = ({ data, symbol, timeframe }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">暂无数据</p>
      </div>
    );
  }

  // 转换数据格式
  const chartData: CandlestickData[] = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume
  })).reverse(); // 反转数据，让最新的在右边

  // 自定义蜡烛图形状
  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, fill, payload } = props;
    const isRising = payload.close > payload.open;
    const color = isRising ? '#10b981' : '#ef4444';
    
    return (
      <g>
        {/* 上下影线 */}
        <line
          x1={x + width / 2}
          y1={y + height / 2 - (payload.high - Math.max(payload.open, payload.close)) * height / (payload.high - payload.low)}
          x2={x + width / 2}
          y2={y + height / 2 + (Math.min(payload.open, payload.close) - payload.low) * height / (payload.high - payload.low)}
          stroke={color}
          strokeWidth={1}
        />
        {/* 实体 */}
        <rect
          x={x}
          y={y + height / 2 - Math.abs(payload.open - payload.close) * height / (payload.high - payload.low) / 2}
          width={width}
          height={Math.abs(payload.open - payload.close) * height / (payload.high - payload.low)}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-gray-600">开盘:</span>
              <span className="font-medium">{data.open.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">最高:</span>
              <span className="font-medium text-green-600">{data.high.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">最低:</span>
              <span className="font-medium text-red-600">{data.low.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">收盘:</span>
              <span className="font-medium">{data.close.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">成交量:</span>
              <span className="font-medium">{data.volume.toFixed(4)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* K线图 */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">价格走势图</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* 蜡烛图 */}
              <Bar
                dataKey="close"
                fill="#10b981"
                shape={<CustomCandlestick />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 成交量图 */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">成交量</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(4), '成交量']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="volume" 
                fill="#3b82f6" 
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 技术指标 */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">技术指标</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">最高价</p>
            <p className="text-lg font-semibold text-green-600">
              {Math.max(...data.map(d => d.high)).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">最低价</p>
            <p className="text-lg font-semibold text-red-600">
              {Math.min(...data.map(d => d.low)).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">平均价</p>
            <p className="text-lg font-semibold text-blue-600">
              {(data.reduce((sum, d) => sum + d.close, 0) / data.length).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">总成交量</p>
            <p className="text-lg font-semibold text-purple-600">
              {data.reduce((sum, d) => sum + d.volume, 0).toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};