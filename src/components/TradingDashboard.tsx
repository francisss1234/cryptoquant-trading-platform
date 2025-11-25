import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Play, Pause, Settings, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface Order {
  id: string;
  exchange_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  quantity: number;
  price?: number;
  stop_price?: number;
  status: 'pending' | 'open' | 'closed' | 'cancelled' | 'rejected';
  filled_quantity: number;
  average_price?: number;
  fees: number;
  created_at: string;
  strategy_id?: string;
  signal_id?: string;
}

interface Position {
  id: string;
  exchange_id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  created_at: string;
  strategy_id?: string;
}

interface TradingStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_volume: number;
  total_fees: number;
  average_trade_size: number;
  win_rate: number;
}

interface TradingConfig {
  max_positions: number;
  max_position_size: number;
  max_daily_trades: number;
  max_slippage: number;
  enable_auto_trading: boolean;
  enable_paper_trading: boolean;
}

const ORDER_TYPES = [
  { value: 'market', label: '市价单' },
  { value: 'limit', label: '限价单' },
  { value: 'stop_loss', label: '止损单' },
  { value: 'take_profit', label: '止盈单' }
];

const ORDER_SIDES = [
  { value: 'buy', label: '买入' },
  { value: 'sell', label: '卖出' }
];

export const TradingDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);
  const [tradingConfig, setTradingConfig] = useState<TradingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const [orderForm, setOrderForm] = useState({
    exchange_id: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy' as 'buy' | 'sell',
    type: 'market' as 'market' | 'limit' | 'stop_loss' | 'take_profit',
    quantity: 0.01,
    price: undefined as number | undefined,
    stop_price: undefined as number | undefined
  });

  useEffect(() => {
    fetchOrders();
    fetchPositions();
    fetchTradingStats();
    fetchTradingConfig();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      const data = await response.json();
      if (data.success) {
        setPositions(data.data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchTradingStats = async () => {
    try {
      const response = await fetch('/api/trading-stats');
      const data = await response.json();
      if (data.success) {
        setTradingStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching trading stats:', error);
    }
  };

  const fetchTradingConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        setTradingConfig(data.data);
      }
    } catch (error) {
      console.error('Error fetching trading config:', error);
    }
  };

  const createOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setOrders([data.data, ...orders]);
        setShowOrderForm(false);
        resetOrderForm();
        fetchTradingStats(); // 更新统计信息
      } else {
        alert('创建订单失败: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ));
      } else {
        alert('取消订单失败: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('取消订单失败');
    }
  };

  const resetOrderForm = () => {
    setOrderForm({
      exchange_id: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 0.01,
      price: undefined,
      stop_price: undefined
    });
  };

  const getOrderStatusBadge = (status: string) => {
    const variants = {
      pending: { label: '待处理', variant: 'secondary' },
      open: { label: '进行中', variant: 'default' },
      closed: { label: '已完成', variant: 'success' },
      cancelled: { label: '已取消', variant: 'outline' },
      rejected: { label: '已拒绝', variant: 'destructive' }
    } as const;

    const statusInfo = variants[status as keyof typeof variants];
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getSideBadge = (side: string) => {
    return side === 'buy' ? (
      <Badge variant="success" className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        买入
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        卖出
      </Badge>
    );
  };

  const totalPositionValue = positions.reduce((sum, pos) => sum + (pos.current_price * pos.quantity), 0);
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);
  const totalRealizedPnL = positions.reduce((sum, pos) => sum + pos.realized_pnl, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">交易执行</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowOrderForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建订单
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            设置
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      {tradingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总交易数</p>
                  <p className="text-2xl font-bold">{tradingStats.total_trades}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">胜率</p>
                  <p className="text-2xl font-bold text-green-600">{tradingStats.win_rate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总手续费</p>
                  <p className="text-2xl font-bold">${tradingStats.total_fees.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">平均交易规模</p>
                  <p className="text-2xl font-bold">${tradingStats.average_trade_size.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 订单创建表单 */}
      {showOrderForm && (
        <Card>
          <CardHeader>
            <CardTitle>创建新订单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易所</label>
                <Select value={orderForm.exchange_id} onValueChange={(value) => setOrderForm({ ...orderForm, exchange_id: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="coinbase">Coinbase</SelectItem>
                    <SelectItem value="okx">OKX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易对</label>
                <Input
                  value={orderForm.symbol}
                  onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                  placeholder="例如: BTC/USDT"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
                <Select value={orderForm.side} onValueChange={(value) => setOrderForm({ ...orderForm, side: value as 'buy' | 'sell' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_SIDES.map(side => (
                      <SelectItem key={side.value} value={side.value}>
                        {side.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <Select value={orderForm.type} onValueChange={(value) => setOrderForm({ ...orderForm, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                <Input
                  type="number"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: parseFloat(e.target.value) })}
                  step="0.001"
                  min="0"
                />
              </div>
              
              {orderForm.type === 'limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <Input
                    type="number"
                    value={orderForm.price || ''}
                    onChange={(e) => setOrderForm({ ...orderForm, price: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                  />
                </div>
              )}
              
              {orderForm.type === 'stop_loss' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">止损价格</label>
                  <Input
                    type="number"
                    value={orderForm.stop_price || ''}
                    onChange={(e) => setOrderForm({ ...orderForm, stop_price: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={createOrder} disabled={loading}>
                {loading ? '创建中...' : '创建订单'}
              </Button>
              <Button onClick={() => setShowOrderForm(false)} variant="outline">
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">持仓</TabsTrigger>
          <TabsTrigger value="orders">订单</TabsTrigger>
          <TabsTrigger value="config">配置</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>当前持仓</CardTitle>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无持仓</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">总持仓价值</p>
                      <p className="text-xl font-bold">${totalPositionValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">未实现盈亏</p>
                      <p className={`text-xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${totalUnrealizedPnL.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">已实现盈亏</p>
                      <p className={`text-xl font-bold ${totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${totalRealizedPnL.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">交易对</th>
                          <th className="text-left py-2">方向</th>
                          <th className="text-left py-2">数量</th>
                          <th className="text-left py-2">入场价格</th>
                          <th className="text-left py-2">当前价格</th>
                          <th className="text-left py-2">未实现盈亏</th>
                          <th className="text-left py-2">已实现盈亏</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map(position => (
                          <tr key={position.id} className="border-b">
                            <td className="py-2 font-medium">{position.symbol}</td>
                            <td className="py-2">
                              <Badge variant={position.side === 'long' ? 'success' : 'destructive'}>
                                {position.side === 'long' ? '多头' : '空头'}
                              </Badge>
                            </td>
                            <td className="py-2">{position.quantity}</td>
                            <td className="py-2">${position.entry_price.toFixed(2)}</td>
                            <td className="py-2">${position.current_price.toFixed(2)}</td>
                            <td className="py-2">
                              <span className={position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${position.unrealized_pnl.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className={position.realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${position.realized_pnl.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>订单历史</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无订单</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">时间</th>
                        <th className="text-left py-2">交易对</th>
                        <th className="text-left py-2">方向</th>
                        <th className="text-left py-2">类型</th>
                        <th className="text-left py-2">数量</th>
                        <th className="text-left py-2">价格</th>
                        <th className="text-left py-2">状态</th>
                        <th className="text-left py-2">手续费</th>
                        <th className="text-left py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-2 text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                          <td className="py-2 font-medium">{order.symbol}</td>
                          <td className="py-2">{getSideBadge(order.side)}</td>
                          <td className="py-2 text-gray-600">
                            {ORDER_TYPES.find(t => t.value === order.type)?.label}
                          </td>
                          <td className="py-2">{order.quantity}</td>
                          <td className="py-2">
                            {order.average_price ? `$${order.average_price.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2">{getOrderStatusBadge(order.status)}</td>
                          <td className="py-2">${order.fees.toFixed(4)}</td>
                          <td className="py-2">
                            {order.status === 'open' || order.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelOrder(order.id)}
                              >
                                取消
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>交易配置</CardTitle>
            </CardHeader>
            <CardContent>
              {tradingConfig && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">最大持仓数</label>
                      <Input
                        type="number"
                        value={tradingConfig.max_positions}
                        onChange={(e) => setTradingConfig({ ...tradingConfig, max_positions: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">最大仓位大小</label>
                      <Input
                        type="number"
                        value={tradingConfig.max_position_size}
                        onChange={(e) => setTradingConfig({ ...tradingConfig, max_position_size: parseFloat(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">每日最大交易数</label>
                      <Input
                        type="number"
                        value={tradingConfig.max_daily_trades}
                        onChange={(e) => setTradingConfig({ ...tradingConfig, max_daily_trades: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">最大滑点 (%)</label>
                      <Input
                        type="number"
                        value={tradingConfig.max_slippage * 100}
                        onChange={(e) => setTradingConfig({ ...tradingConfig, max_slippage: parseFloat(e.target.value) / 100 })}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tradingConfig.enable_auto_trading}
                        onChange={(e) => setTradingConfig({ ...tradingConfig, enable_auto_trading: e.target.checked })}
                      />
                      启用自动交易
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tradingConfig.enable_paper_trading}
                        onChange={(e) => setTradingConfig({ ...tradingConfig, enable_paper_trading: e.target.checked })}
                      />
                      启用模拟交易
                    </label>
                  </div>
                  
                  <Button>保存配置</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};