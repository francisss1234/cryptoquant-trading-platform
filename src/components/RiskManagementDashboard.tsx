import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface RiskMetrics {
  portfolioValue: number;
  totalPnL: number;
  dailyPnL: number;
  sharpeRatio: number;
  maximumDrawdown: number;
  var95: number;
  expectedShortfall: number;
  volatility: number;
  beta: number;
  alpha: number;
}

interface PositionRisk {
  positionId: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  pnlPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
}

interface RiskAlert {
  id: string;
  type: 'drawdown' | 'var' | 'concentration' | 'volatility' | 'correlation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  positionId?: string;
  threshold: number;
  currentValue: number;
}

interface RiskLimit {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxVar: number;
  maxConcentration: number;
  maxLeverage: number;
}

export const RiskManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'alerts' | 'settings'>('overview');
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [positionRisks, setPositionRisks] = useState<PositionRisk[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [riskLimits, setRiskLimits] = useState<RiskLimit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取投资组合风险指标
      const metricsResponse = await fetch('/api/risk/portfolio-metrics');
      const metricsData = await metricsResponse.json();
      setRiskMetrics(metricsData);

      // 获取持仓风险
      const positionsResponse = await fetch('/api/risk/positions');
      const positionsData = await positionsResponse.json();
      setPositionRisks(positionsData);

      // 获取风险警报
      const alertsResponse = await fetch('/api/risk/alerts');
      const alertsData = await alertsResponse.json();
      setRiskAlerts(alertsData);

      // 获取风险限额
      const limitsResponse = await fetch('/api/risk/limits');
      const limitsData = await limitsResponse.json();
      setRiskLimits(limitsData);
    } catch (err) {
      setError('获取风险数据失败');
      console.error('Error fetching risk data:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/risk/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      setRiskAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const updateRiskLimits = async (newLimits: Partial<RiskLimit>) => {
    try {
      await fetch('/api/risk/limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLimits),
      });
      setRiskLimits(prev => prev ? { ...prev, ...newLimits } : null);
    } catch (err) {
      console.error('Error updating risk limits:', err);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">风险管理</h1>
        <p className="text-gray-600">量化交易风险监控与管理</p>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: '概览' },
            { id: 'positions', name: '持仓风险' },
            { id: 'alerts', name: '风险警报' },
            { id: 'settings', name: '风险设置' }
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
      {activeTab === 'overview' && riskMetrics && (
        <div className="space-y-6">
          {/* 关键风险指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">投资组合价值</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${riskMetrics.portfolioValue.toLocaleString()}
                </div>
                <p className={`text-xs ${
                  riskMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {riskMetrics.totalPnL >= 0 ? '+' : ''}${riskMetrics.totalPnL.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">夏普比率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {riskMetrics.sharpeRatio.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">
                  风险调整后收益
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最大回撤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {Math.abs(riskMetrics.maximumDrawdown * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-gray-500">
                  历史最大损失
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VaR (95%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.abs(riskMetrics.var95 * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-gray-500">
                  风险价值
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 风险分析图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>风险指标概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">波动率</span>
                    <span className="font-medium">{(riskMetrics.volatility * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">贝塔系数</span>
                    <span className="font-medium">{riskMetrics.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">阿尔法</span>
                    <span className="font-medium">{(riskMetrics.alpha * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">预期亏损</span>
                    <span className="font-medium text-red-600">{(riskMetrics.expectedShortfall * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>当日表现</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">当日盈亏</span>
                    <span className={`font-medium ${
                      riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {riskMetrics.dailyPnL >= 0 ? '+' : ''}${riskMetrics.dailyPnL.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">风险限额使用率</span>
                    <span className="font-medium">{((Math.abs(riskMetrics.totalPnL) / (riskLimits?.maxDailyLoss || 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">持仓数量</span>
                    <span className="font-medium">{positionRisks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">高风险持仓</span>
                    <span className="font-medium text-red-600">
                      {positionRisks.filter(p => p.riskLevel === 'high').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 持仓风险标签页 */}
      {activeTab === 'positions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">持仓风险分析</h3>
            <Button onClick={fetchRiskData} variant="outline">
              刷新数据
            </Button>
          </div>

          <div className="grid gap-4">
            {positionRisks.map((position) => (
              <Card key={position.positionId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-sm font-medium">{position.symbol}</CardTitle>
                    <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                      {position.side === 'long' ? '多头' : '空头'}
                    </Badge>
                    <Badge className={getRiskLevelColor(position.riskLevel)}>
                      {position.riskLevel === 'low' ? '低风险' : 
                       position.riskLevel === 'medium' ? '中风险' : '高风险'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">持仓数量</p>
                      <p className="font-medium">{position.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">入场价格</p>
                      <p className="font-medium">${position.entryPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">当前价格</p>
                      <p className="font-medium">${position.currentPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">未实现盈亏</p>
                      <p className={`font-medium ${
                        position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">盈亏百分比</p>
                      <p className={`font-medium ${
                        position.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {position.pnlPercentage >= 0 ? '+' : ''}{(position.pnlPercentage * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">风险回报比</p>
                      <p className="font-medium">{position.riskRewardRatio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">止损价</p>
                      <p className="font-medium text-red-600">${position.stopLoss.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">止盈价</p>
                      <p className="font-medium text-green-600">${position.takeProfit.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 风险警报标签页 */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">风险警报</h3>
            <Badge variant="outline">{riskAlerts.length} 个活跃警报</Badge>
          </div>

          <div className="space-y-4">
            {riskAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getAlertSeverityColor(alert.severity)}>
                      {alert.severity === 'info' ? '信息' :
                       alert.severity === 'warning' ? '警告' : '严重'}
                    </Badge>
                    <CardTitle className="text-sm font-medium">
                      {alert.type === 'drawdown' ? '回撤警报' :
                       alert.type === 'var' ? 'VaR警报' :
                       alert.type === 'concentration' ? '集中度警报' :
                       alert.type === 'volatility' ? '波动率警报' : '相关性警报'}
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => acknowledgeAlert(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    确认
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>阈值: {alert.threshold}</span>
                    <span>当前值: {alert.currentValue}</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 风险设置标签页 */}
      {activeTab === 'settings' && riskLimits && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">风险限额设置</h3>

          <Card>
            <CardHeader>
              <CardTitle>风险参数配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大持仓规模
                  </label>
                  <input
                    type="number"
                    value={riskLimits.maxPositionSize}
                    onChange={(e) => updateRiskLimits({ maxPositionSize: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大日亏损
                  </label>
                  <input
                    type="number"
                    value={riskLimits.maxDailyLoss}
                    onChange={(e) => updateRiskLimits({ maxDailyLoss: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大回撤
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={riskLimits.maxDrawdown}
                    onChange={(e) => updateRiskLimits({ maxDrawdown: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大VaR
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={riskLimits.maxVar}
                    onChange={(e) => updateRiskLimits({ maxVar: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大集中度
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={riskLimits.maxConcentration}
                    onChange={(e) => updateRiskLimits({ maxConcentration: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大杠杆
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskLimits.maxLeverage}
                    onChange={(e) => updateRiskLimits({ maxLeverage: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};