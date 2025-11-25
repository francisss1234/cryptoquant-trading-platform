import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OrderBookProps {
  bids: [number, number][];
  asks: [number, number][];
  symbol: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ bids, asks, symbol }) => {
  // 按价格排序
  const sortedBids = [...bids].sort((a, b) => b[0] - a[0]); // 高价优先
  const sortedAsks = [...asks].sort((a, b) => a[0] - b[0]); // 低价优先

  // 计算总量
  const totalBidVolume = sortedBids.reduce((sum, [, volume]) => sum + volume, 0);
  const totalAskVolume = sortedAsks.reduce((sum, [, volume]) => sum + volume, 0);

  // 获取当前价格（中间价）
  const bestBid = sortedBids[0]?.[0] || 0;
  const bestAsk = sortedAsks[0]?.[0] || 0;
  const midPrice = (bestBid + bestAsk) / 2;

  const formatPrice = (price: number) => {
    return price.toFixed(8);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toFixed(4);
  };

  const getVolumePercentage = (volume: number, totalVolume: number) => {
    return (volume / totalVolume) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 当前价格 */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{symbol} 当前价格</h3>
          <div className="text-3xl font-bold text-blue-600">
            {midPrice > 0 ? formatPrice(midPrice) : 'N/A'}
          </div>
          <div className="flex justify-center items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>最高买入: {bestBid > 0 ? formatPrice(bestBid) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span>最低卖出: {bestAsk > 0 ? formatPrice(bestAsk) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 买入订单 */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              买入订单 (Bids)
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              总量: {formatVolume(totalBidVolume)}
            </p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-500 mb-3">
              <div>价格</div>
              <div>数量</div>
              <div>累计</div>
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {sortedBids.slice(0, 20).map(([price, volume], index) => {
                const cumulativeVolume = sortedBids.slice(0, index + 1).reduce((sum, [, vol]) => sum + vol, 0);
                const percentage = getVolumePercentage(volume, totalBidVolume);
                
                return (
                  <div key={`bid-${index}`} className="relative grid grid-cols-3 gap-4 py-2 hover:bg-gray-50 rounded">
                    {/* 成交量背景条 */}
                    <div 
                      className="absolute inset-y-0 right-0 bg-green-100 opacity-30 rounded"
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="relative text-green-600 font-medium">
                      {formatPrice(price)}
                    </div>
                    <div className="relative text-gray-900">
                      {formatVolume(volume)}
                    </div>
                    <div className="relative text-gray-600">
                      {formatVolume(cumulativeVolume)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 卖出订单 */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              卖出订单 (Asks)
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              总量: {formatVolume(totalAskVolume)}
            </p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-500 mb-3">
              <div>价格</div>
              <div>数量</div>
              <div>累计</div>
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {sortedAsks.slice(0, 20).map(([price, volume], index) => {
                const cumulativeVolume = sortedAsks.slice(0, index + 1).reduce((sum, [, vol]) => sum + vol, 0);
                const percentage = getVolumePercentage(volume, totalAskVolume);
                
                return (
                  <div key={`ask-${index}`} className="relative grid grid-cols-3 gap-4 py-2 hover:bg-gray-50 rounded">
                    {/* 成交量背景条 */}
                    <div 
                      className="absolute inset-y-0 left-0 bg-red-100 opacity-30 rounded"
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="relative text-red-600 font-medium">
                      {formatPrice(price)}
                    </div>
                    <div className="relative text-gray-900">
                      {formatVolume(volume)}
                    </div>
                    <div className="relative text-gray-600">
                      {formatVolume(cumulativeVolume)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 市场深度图 */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">市场深度</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">买入深度</span>
              <span className="text-sm font-medium text-green-600">
                {formatVolume(totalBidVolume)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">卖出深度</span>
              <span className="text-sm font-medium text-red-600">
                {formatVolume(totalAskVolume)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          价差: {midPrice > 0 && bestAsk > 0 && bestBid > 0 
            ? ((bestAsk - bestBid) / midPrice * 100).toFixed(4) + '%'
            : 'N/A'
          }
        </div>
      </div>
    </div>
  );
};