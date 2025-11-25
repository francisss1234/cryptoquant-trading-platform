import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SignalData } from '@/hooks/useWebSocket';
import { TrendingUp, TrendingDown, AlertTriangle, Info, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

interface RealTimeStrategySignalsProps {
  strategyId?: string;
  className?: string;
  enableNotifications?: boolean;
}

interface EnhancedSignalData extends SignalData {
  read?: boolean;
}

const SignalIcon = ({ signal }: { signal: EnhancedSignalData }) => {
  switch (signal.signal) {
    case 'BUY':
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    case 'SELL':
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    case 'HOLD':
      return <Info className="w-5 h-5 text-blue-500" />;
    case 'ALERT':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    default:
      return <Info className="w-5 h-5 text-gray-500" />;
  }
};

const getSignalColor = (signal: string) => {
  switch (signal) {
    case 'BUY':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'SELL':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'HOLD':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'alert':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getSignalStrengthColor = (strength: number) => {
  if (strength >= 0.8) return 'text-green-600';
  if (strength >= 0.6) return 'text-yellow-600';
  if (strength >= 0.4) return 'text-orange-600';
  return 'text-red-600';
};

const formatSignalStrength = (strength: number) => {
  return `${(strength * 100).toFixed(0)}%`;
};

export const RealTimeStrategySignals: React.FC<RealTimeStrategySignalsProps> = ({
  strategyId,
  className = '',
  enableNotifications = true
}) => {
  const { signals, subscribeToSignals, unsubscribeFromSignals } = useWebSocket();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(enableNotifications);

  useEffect(() => {
    subscribeToSignals(strategyId);
    return () => {
      unsubscribeFromSignals(strategyId);
    };
  }, [strategyId, subscribeToSignals, unsubscribeFromSignals]);

  // Show toast notifications for new signals
  useEffect(() => {
    if (!notificationsEnabled || signals.length === 0) return;

    const latestSignal = signals[signals.length - 1];
    if (latestSignal) {
      const message = `${latestSignal.symbol.toUpperCase()} ${latestSignal.signal} signal at $${latestSignal.price.toFixed(4)}`;
      
      switch (latestSignal.signal) {
        case 'BUY':
          toast.success(message, {
            icon: <TrendingUp className="w-5 h-5" />,
            duration: 5000,
          });
          break;
        case 'SELL':
          toast.error(message, {
            icon: <TrendingDown className="w-5 h-5" />,
            duration: 5000,
          });
          break;
        case 'ALERT':
          toast.warning(message, {
            icon: <AlertTriangle className="w-5 h-5" />,
            duration: 10000,
          });
          break;
        default:
          toast.info(message, {
            icon: <Info className="w-5 h-5" />,
            duration: 3000,
          });
      }
    }
  }, [signals, notificationsEnabled]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast.info(`Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`);
  };

  const recentSignals = signals.slice(-20).reverse();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Real-time Strategy Signals
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleNotifications}
            className={`p-2 rounded-lg transition-colors ${
              notificationsEnabled 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>
      </div>

      {recentSignals.length === 0 ? (
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No recent signals</p>
          <p className="text-sm text-gray-400">Signals will appear here when generated</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentSignals.map((signal, index) => (
            <div 
              key={`${signal.symbol}-${signal.timestamp}-${index}`} 
              className={`border rounded-lg p-4 transition-all duration-300 ${
                getSignalColor(signal.signal)
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <SignalIcon signal={signal as EnhancedSignalData} />
                  <div>
                    <div className="font-medium text-gray-900">
                {signal.symbol.toUpperCase()} {signal.signal}
              </div>
                    <div className="text-sm text-gray-500">
                      {signal.timestamp ? formatTimestamp(signal.timestamp) : new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(signal.price)}
                  </div>
                  <div className={`text-sm font-medium ${
                    getSignalStrengthColor(signal.strength)
                  }`}>
                    Strength: {formatSignalStrength(signal.strength)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Strength</div>
                  <div className="font-medium text-gray-900">
                    {(signal.strength * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="font-medium text-gray-900">
                    {formatPrice(signal.price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Total Signals: {signals.length}</span>
          <span>Auto-updating in real-time</span>
        </div>
      </div>
    </div>
  );
};