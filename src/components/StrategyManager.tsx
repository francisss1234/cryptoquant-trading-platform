import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Play, BarChart3, Settings, Trash2, Edit } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'trend_following' | 'mean_reversion' | 'momentum' | 'arbitrage';
  parameters: Record<string, any>;
  indicators: string[];
  rules: StrategyRule[];
  risk_management: RiskManagementConfig;
  is_active: boolean;
  created_at: string;
}

interface StrategyRule {
  condition: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  parameters: Record<string, any>;
  weight: number;
}

interface RiskManagementConfig {
  max_position_size: number;
  stop_loss_percentage: number;
  take_profit_percentage: number;
  max_drawdown_percentage: number;
  position_sizing_method: 'fixed' | 'percentage' | 'kelly_criterion';
}

interface BacktestResult {
  strategy_id: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  profit_factor: number;
  trades: any[];
}

const INDICATORS = [
  'SMA', 'EMA', 'RSI', 'MACD', 'BB', 'STOCH', 'ATR', 'VWAP', 'MOM'
];

const STRATEGY_TYPES = [
  { value: 'trend_following', label: '趋势跟踪' },
  { value: 'mean_reversion', label: '均值回归' },
  { value: 'momentum', label: '动量策略' },
  { value: 'arbitrage', label: '套利策略' }
];

export const StrategyManager: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'trend_following' as Strategy['type'],
    indicators: [] as string[],
    rules: [] as StrategyRule[],
    risk_management: {
      max_position_size: 10,
      stop_loss_percentage: 5,
      take_profit_percentage: 10,
      max_drawdown_percentage: 15,
      position_sizing_method: 'percentage' as const
    }
  });

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/strategies');
      const data = await response.json();
      if (data.success) {
        setStrategies(data.data);
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
    }
  };

  const createStrategy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parameters: {},
          is_active: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setStrategies([...strategies, data.data]);
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async (strategyId: string) => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      
      const response = await fetch(`/api/strategies/${strategyId}/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTC/USDT',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          initial_capital: 10000
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setBacktestResult(data.data);
      }
    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'trend_following',
      indicators: [],
      rules: [],
      risk_management: {
        max_position_size: 10,
        stop_loss_percentage: 5,
        take_profit_percentage: 10,
        max_drawdown_percentage: 15,
        position_sizing_method: 'percentage'
      }
    });
  };

  const addIndicator = (indicator: string) => {
    if (!formData.indicators.includes(indicator)) {
      setFormData({
        ...formData,
        indicators: [...formData.indicators, indicator]
      });
    }
  };

  const removeIndicator = (indicator: string) => {
    setFormData({
      ...formData,
      indicators: formData.indicators.filter(ind => ind !== indicator)
    });
  };

  const addRule = () => {
    const newRule: StrategyRule = {
      condition: 'RSI.values[RSI.values.length - 1] < 30',
      action: 'BUY',
      parameters: {},
      weight: 1.0
    };
    
    setFormData({
      ...formData,
      rules: [...formData.rules, newRule]
    });
  };

  const updateRule = (index: number, field: keyof StrategyRule, value: any) => {
    const updatedRules = [...formData.rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setFormData({ ...formData, rules: updatedRules });
  };

  const removeRule = (index: number) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">策略管理</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建策略
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>创建新策略</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">策略名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入策略名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述策略逻辑和目标"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">策略类型</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">技术指标</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.indicators.map(indicator => (
                    <Badge key={indicator} variant="secondary" className="flex items-center gap-1">
                      {indicator}
                      <button
                        onClick={() => removeIndicator(indicator)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {INDICATORS.map(indicator => (
                    <Button
                      key={indicator}
                      size="sm"
                      variant="outline"
                      onClick={() => addIndicator(indicator)}
                      disabled={formData.indicators.includes(indicator)}
                    >
                      {indicator}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">交易规则</label>
                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                      <Select value={rule.action} onValueChange={(value) => updateRule(index, 'action', value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUY">买入</SelectItem>
                          <SelectItem value="SELL">卖出</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={rule.condition}
                        onChange={(e) => updateRule(index, 'condition', e.target.value)}
                        placeholder="条件表达式"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={rule.weight}
                        onChange={(e) => updateRule(index, 'weight', parseFloat(e.target.value))}
                        placeholder="权重"
                        className="w-20"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRule(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={addRule} variant="outline" size="sm" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" />
                  添加规则
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">风险管理</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最大仓位 (%)</label>
                    <Input
                      type="number"
                      value={formData.risk_management.max_position_size}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_management: { ...formData.risk_management, max_position_size: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">止损 (%)</label>
                    <Input
                      type="number"
                      value={formData.risk_management.stop_loss_percentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_management: { ...formData.risk_management, stop_loss_percentage: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">止盈 (%)</label>
                    <Input
                      type="number"
                      value={formData.risk_management.take_profit_percentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_management: { ...formData.risk_management, take_profit_percentage: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最大回撤 (%)</label>
                    <Input
                      type="number"
                      value={formData.risk_management.max_drawdown_percentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_management: { ...formData.risk_management, max_drawdown_percentage: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createStrategy} disabled={loading || !formData.name}>
                  {loading ? '创建中...' : '创建策略'}
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="outline">
                  取消
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map(strategy => (
          <Card key={strategy.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <Badge variant={strategy.is_active ? 'success' : 'secondary'} className="mt-1">
                    {strategy.is_active ? '运行中' : '已停止'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => runBacktest(strategy.id)}>
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">类型:</span>
                  <span>{STRATEGY_TYPES.find(t => t.value === strategy.type)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">指标:</span>
                  <span>{strategy.indicators.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">规则:</span>
                  <span>{strategy.rules.length} 条</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {backtestResult && (
        <Card>
          <CardHeader>
            <CardTitle>回测结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {backtestResult.total_return.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">总收益率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {backtestResult.sharpe_ratio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">夏普比率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {backtestResult.max_drawdown.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">最大回撤</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {backtestResult.win_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">胜率</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">初始资金:</span>
                <span>${backtestResult.initial_capital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">最终资金:</span>
                <span>${backtestResult.final_capital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">总交易数:</span>
                <span>{backtestResult.total_trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">盈利交易:</span>
                <span>{backtestResult.winning_trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">亏损交易:</span>
                <span>{backtestResult.losing_trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">盈利因子:</span>
                <span>{backtestResult.profit_factor.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};