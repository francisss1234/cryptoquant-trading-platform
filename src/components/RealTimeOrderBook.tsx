import React, { useEffect, useMemo } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { OrderBookData } from '@/hooks/useWebSocket';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface RealTimeOrderBookProps {
  symbol: string;
  exchange: string;
  depth?: number;
  className?: string;
}

interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

export const RealTimeOrderBook: React.FC<RealTimeOrderBookProps> = ({
  symbol,
  exchange,
  depth = 10,
  className = ''
}) => {
  const { orderBookData, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const symbolKey = `${exchange}:${symbol}`
    subscribe('orderbook', symbolKey)
    return () => {
      unsubscribe('orderbook', symbolKey)
    }
  }, [symbol, exchange, subscribe, unsubscribe])

  const data = orderBookData.get(`${exchange}:${symbol}`);

  const processedOrderBook = useMemo(() => {
    if (!data) return { bids: [], asks: [], spread: 0 };

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    // Process bids (buy orders)
    data.bids.forEach((bid, index) => {
      const [price, quantity] = bid;
      const total = bids.reduce((sum, level) => sum + level.quantity, 0) + quantity;
      bids.push({
        price: price,
        quantity: quantity,
        total: total
      });
    });

    // Process asks (sell orders)
    data.asks.forEach((ask, index) => {
      const [price, quantity] = ask;
      const total = asks.reduce((sum, level) => sum + level.quantity, 0) + quantity;
      asks.push({
        price: price,
        quantity: quantity,
        total: total
      });
    });

    // Calculate spread
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spread = bestAsk - bestBid;

    return {
      bids: bids.slice(0, depth),
      asks: asks.slice(0, depth),
      spread: spread
    };
  }, [data, depth]);

  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  const formatQuantity = (quantity: number) => {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)}K`;
    }
    return quantity.toFixed(2);
  };

  const getBidBarWidth = (quantity: number, maxQuantity: number) => {
    const percentage = (quantity / maxQuantity) * 100;
    return `${Math.max(percentage, 5)}%`;
  };

  const getAskBarWidth = (quantity: number, maxQuantity: number) => {
    const percentage = (quantity / maxQuantity) * 100;
    return `${Math.max(percentage, 5)}%`;
  };

  const maxBidQuantity = Math.max(...processedOrderBook.bids.map(b => b.quantity), 1);
  const maxAskQuantity = Math.max(...processedOrderBook.asks.map(a => a.quantity), 1);

  const totalBidQuantity = processedOrderBook.bids.reduce((sum, bid) => sum + bid.quantity, 0);
  const totalAskQuantity = processedOrderBook.asks.reduce((sum, ask) => sum + ask.quantity, 0);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {symbol.toUpperCase()} Order Book
          </h3>
          <p className="text-sm text-gray-500">
            {exchange.toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Spread</div>
          <div className="text-lg font-semibold text-gray-900">
            ${formatPrice(processedOrderBook.spread)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Bids (Buy Orders) */}
        <div>
          <div className="flex items-center mb-3">
            <ArrowUpCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-600">Bids</span>
            <span className="text-xs text-gray-500 ml-auto">
              Total: {formatQuantity(totalBidQuantity)}
            </span>
          </div>
          
          <div className="space-y-1">
            {processedOrderBook.bids.map((bid, index) => (
              <div key={index} className="relative group">
                <div 
                  className="absolute inset-0 bg-green-100 opacity-20 rounded"
                  style={{ width: getBidBarWidth(bid.quantity, maxBidQuantity) }}
                />
                <div className="relative flex justify-between items-center py-1 px-2 text-sm">
                  <span className="font-mono text-green-600">
                    ${formatPrice(bid.price)}
                  </span>
                  <span className="text-gray-700">
                    {formatQuantity(bid.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex items-center mb-3">
            <ArrowDownCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-600">Asks</span>
            <span className="text-xs text-gray-500 ml-auto">
              Total: {formatQuantity(totalAskQuantity)}
            </span>
          </div>
          
          <div className="space-y-1">
            {processedOrderBook.asks.map((ask, index) => (
              <div key={index} className="relative group">
                <div 
                  className="absolute inset-0 bg-red-100 opacity-20 rounded"
                  style={{ width: getAskBarWidth(ask.quantity, maxAskQuantity) }}
                />
                <div className="relative flex justify-between items-center py-1 px-2 text-sm">
                  <span className="font-mono text-red-600">
                    ${formatPrice(ask.price)}
                  </span>
                  <span className="text-gray-700">
                    {formatQuantity(ask.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Depth Visualization */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Market Depth</h4>
        <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${(totalBidQuantity / (totalBidQuantity + totalAskQuantity)) * 100}%` }}
          />
          <div 
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${(totalAskQuantity / (totalBidQuantity + totalAskQuantity)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Bid Volume: {formatQuantity(totalBidQuantity)}</span>
          <span>Ask Volume: {formatQuantity(totalAskQuantity)}</span>
        </div>
      </div>

      {/* Last Update */}
      {data && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <span className="text-xs text-gray-400">
            Last Update: {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};