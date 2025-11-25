import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { KlineData } from '@/hooks/useWebSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RealTimeKlineChartProps {
  symbol: string;
  exchange: string;
  interval?: string;
  className?: string;
}

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CustomCandlestick = (props: any) => {
  const { x, y, width, height, fill, payload } = props;
  const isGreen = payload.close >= payload.open;
  const color = isGreen ? '#10b981' : '#ef4444';
  
  return (
    <g>
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const CandlestickTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
        <p className="text-sm text-gray-600">{`Open: $${data.open.toFixed(4)}`}</p>
        <p className="text-sm text-gray-600">{`High: $${data.high.toFixed(4)}`}</p>
        <p className="text-sm text-gray-600">{`Low: $${data.low.toFixed(4)}`}</p>
        <p className="text-sm text-gray-600">{`Close: $${data.close.toFixed(4)}`}</p>
        <p className="text-sm text-gray-600">{`Volume: ${data.volume.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

export const RealTimeKlineChart: React.FC<RealTimeKlineChartProps> = ({
  symbol,
  exchange,
  interval = '1m',
  className = ''
}) => {
  const { klineData, subscribe, unsubscribe } = useWebSocket();
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

  const convertKlineToCandlestick = useCallback((kline: KlineData): CandlestickData => {
    const timestamp = new Date(kline.timestamp);
    const timeStr = timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    return {
      time: timeStr,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
      volume: kline.volume
    };
  }, []);

  useEffect(() => {
    const symbolKey = `${exchange}:${symbol}:${interval}`
    subscribe('kline', symbolKey)
    return () => {
      unsubscribe('kline', symbolKey)
    }
  }, [symbol, exchange, interval, subscribe, unsubscribe])

  useEffect(() => {
    const dataKey = `${exchange}:${symbol}:${interval}`;
    const klines = klineData.get(dataKey) || [];
    
    if (klines.length > 0) {
      const candlesticks = klines.map(convertKlineToCandlestick);
      setCandlestickData(candlesticks);
    }
  }, [klineData, symbol, exchange, interval, convertKlineToCandlestick]);

  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(2);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {symbol.toUpperCase()} K-line Chart
          </h3>
          <p className="text-sm text-gray-500">
            {exchange.toUpperCase()} • {interval}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('candlestick')}
            className={`px-3 py-1 text-xs rounded ${
              chartType === 'candlestick'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Candlestick
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-xs rounded ${
              chartType === 'line'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'candlestick' ? (
            <LineChart data={candlestickData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                tickFormatter={formatPrice}
              />
              <Tooltip content={<CandlestickTooltip />} />
              <Line 
                type="monotone" 
                dataKey="high" 
                stroke="#10b981" 
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="low" 
                stroke="#ef4444" 
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 4, fill: '#ef4444' }}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
            </LineChart>
          ) : (
            <LineChart data={candlestickData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                tickFormatter={formatPrice}
              />
              <Tooltip 
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {candlestickData.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">Open</div>
            <div className="font-medium text-gray-900">
              ${formatPrice(candlestickData[candlestickData.length - 1].open)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">High</div>
            <div className="font-medium text-green-600">
              ${formatPrice(Math.max(...candlestickData.map(d => d.high)))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Low</div>
            <div className="font-medium text-red-600">
              ${formatPrice(Math.min(...candlestickData.map(d => d.low)))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Volume</div>
            <div className="font-medium text-gray-900">
              {formatVolume(candlestickData.reduce((sum, d) => sum + d.volume, 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};