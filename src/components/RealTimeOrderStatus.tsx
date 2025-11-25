import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface RealTimeOrderStatusProps {
  userId: string;
  className?: string;
}

interface OrderUpdate {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  price: number;
  quantity: number;
  filledQuantity: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'failed';
  timestamp: number;
  exchange: string;
  profit?: number;
  profitPercent?: number;
}

const OrderStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'filled':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'partially_filled':
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-gray-500" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-yellow-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'filled':
      return 'text-green-600 bg-green-50';
    case 'partially_filled':
      return 'text-blue-600 bg-blue-50';
    case 'cancelled':
      return 'text-gray-600 bg-gray-50';
    case 'failed':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-yellow-600 bg-yellow-50';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').toUpperCase();
};

export const RealTimeOrderStatus: React.FC<RealTimeOrderStatusProps> = ({
  userId,
  className = ''
}) => {
  const { orderUpdates, subscribeToOrders, unsubscribeFromOrders } = useWebSocket();

  useEffect(() => {
    subscribeToOrders(userId);
    return () => {
      unsubscribeFromOrders(userId);
    };
  }, [userId, subscribeToOrders, unsubscribeFromOrders]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(4)}`;
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toFixed(4);
  };

  const formatProfit = (profit: number) => {
    const sign = profit >= 0 ? '+' : '';
    return `${sign}$${profit.toFixed(2)}`;
  };

  const getFillPercentage = (order: OrderUpdate) => {
    return (order.filledQuantity / order.quantity) * 100;
  };

  const recentOrders = orderUpdates.slice(-10).reverse();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Real-time Order Status
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      {recentOrders.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No recent orders</p>
          <p className="text-sm text-gray-400">Orders will appear here when placed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentOrders.map((order, index) => {
            const fillPercentage = getFillPercentage(order);
            const isProfit = (order.profit || 0) >= 0;
            
            return (
              <div key={`${order.orderId}-${order.timestamp}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <OrderStatusIcon status={order.status} />
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.symbol.toUpperCase()} {order.side.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.exchange.toUpperCase()} • {order.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(order.price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Quantity</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatQuantity(order.quantity)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Filled</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatQuantity(order.filledQuantity)}
                    </div>
                  </div>
                </div>

                {order.status !== 'cancelled' && order.status !== 'failed' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Fill Progress</span>
                      <span>{fillPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          order.status === 'filled' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {order.profit !== undefined && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Profit</span>
                    <span className={`text-sm font-medium ${
                      isProfit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatProfit(order.profit)}
                      {order.profitPercent && (
                        <span className="ml-1">
                          ({order.profitPercent >= 0 ? '+' : ''}{order.profitPercent.toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Total Orders: {orderUpdates.length}</span>
          <span>Auto-updating every second</span>
        </div>
      </div>
    </div>
  );
};