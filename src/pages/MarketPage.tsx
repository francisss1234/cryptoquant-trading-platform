import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TradingPair {
  id: number;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  exchange: string;
  price: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  change_24h: number;
  change_percent_24h: number;
  bid_price?: number;
  ask_price?: number;
  status: string;
  last_updated: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  data: TradingPair[];
  pagination: PaginationInfo;
  timestamp: string;
}

const EXCHANGES = [
  { value: '', label: '所有交易所' },
  { value: 'binance', label: 'Binance' },
  { value: 'coinbase', label: 'Coinbase Pro' },
  { value: 'okx', label: 'OKX' }
];

const SORT_OPTIONS = [
  { value: 'volume_24h', label: '交易量' },
  { value: 'price', label: '价格' },
  { value: 'change_percent_24h', label: '涨跌幅' },
  { value: 'symbol', label: '交易对' },
  { value: 'last_updated', label: '更新时间' }
];

export default function MarketPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    exchange: searchParams.get('exchange') || '',
    sortBy: searchParams.get('sortBy') || 'volume_24h',
    sortOrder: searchParams.get('sortOrder') || 'DESC'
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [collectorStatus, setCollectorStatus] = useState<any>(null);
  const [currencyUpdateInfo, setCurrencyUpdateInfo] = useState<any>(null);

  // 获取交易对数据
  const fetchTradingPairs = async (page: number = 1, showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...filters
      });

      const response = await fetch(`/api/trading-pairs/trading-pairs?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setTradingPairs(result.data);
        setPagination(result.pagination);
        setLastUpdate(new Date(result.timestamp));
      } else {
        toast.error('获取交易对数据失败');
      }
    } catch (error) {
      console.error('获取交易对数据失败:', error);
      toast.error('获取交易对数据失败');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 获取数据收集器状态
  const fetchCollectorStatus = async () => {
    try {
      const response = await fetch('/api/trading-pairs/collector/status');
      const result = await response.json();
      
      if (result.success) {
        setCollectorStatus(result.data);
      }
    } catch (error) {
      console.error('获取收集器状态失败:', error);
    }
  };

  // 获取币种更新信息
  const fetchCurrencyUpdateInfo = async () => {
    try {
      const response = await fetch('/api/currency-info/currency-update-info');
      const result = await response.json();
      
      if (result.success) {
        setCurrencyUpdateInfo({
          totalPairs: result.data.totalPairs,
          baseCurrencies: result.data.baseCurrencies,
          quoteCurrencies: result.data.quoteCurrencies,
          lastUpdate: result.data.lastUpdate
        });
      }
    } catch (error) {
      console.error('获取币种更新信息失败:', error);
    }
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTradingPairs(pagination.page, false);
    await fetchCollectorStatus();
    await fetchCurrencyUpdateInfo();
    setRefreshing(false);
    toast.success('数据已刷新');
  };

  // 处理过滤器变化
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // 更新URL参数
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTradingPairs(newPage);
    }
  };

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toFixed(8);
  };

  // 获取交易所标签颜色
  const getExchangeBadgeColor = (exchange: string) => {
    const colors = {
      binance: 'bg-yellow-500',
      coinbase: 'bg-blue-500',
      okx: 'bg-green-500'
    };
    return colors[exchange as keyof typeof colors] || 'bg-gray-500';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRADING': return 'text-green-600';
      case 'BREAK': return 'text-yellow-600';
      case 'HALT': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  useEffect(() => {
    fetchTradingPairs(1);
    fetchCollectorStatus();
    fetchCurrencyUpdateInfo();
    
    // 每30秒自动刷新
    const interval = setInterval(() => {
      fetchTradingPairs(pagination.page, false);
      fetchCollectorStatus();
      fetchCurrencyUpdateInfo();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters]);

  if (loading && tradingPairs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">交易市场</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>加载交易对数据...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和状态 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">交易市场</h1>
          <p className="text-gray-600 mt-1">
            实时交易对数据 • 
            {lastUpdate && (
              <span className="text-sm">
                最后更新: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 数据收集器状态 */}
          {collectorStatus && (
            <div className="flex items-center space-x-2 text-sm">
              {collectorStatus.health.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-gray-600">
                数据状态: {collectorStatus.health.status === 'healthy' ? '正常' : '异常'}
              </span>
            </div>
          )}
          
          {/* 币种更新信息 */}
          {currencyUpdateInfo && (
            <div className="flex items-center space-x-2 text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <div className="text-blue-700">
                <span className="font-medium">📊 币种更新:</span>
                <span className="ml-2">{currencyUpdateInfo.totalPairs} 交易对</span>
                <span className="mx-1">•</span>
                <span>{currencyUpdateInfo.baseCurrencies} 基础币种</span>
                <span className="mx-1">•</span>
                <span>{currencyUpdateInfo.quoteCurrencies} 计价币种</span>
                {currencyUpdateInfo.lastUpdate && (
                  <>
                    <span className="mx-2">|</span>
                    <span className="text-blue-600 text-xs">
                      更新: {new Date(parseInt(currencyUpdateInfo.lastUpdate)).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总交易对</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              来自 {EXCHANGES.length - 1} 个交易所
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当前页</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📄</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.page}</div>
            <p className="text-xs text-muted-foreground">
              共 {pagination.totalPages} 页
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本页交易对</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tradingPairs.length}</div>
            <p className="text-xs text-muted-foreground">
              每页 {pagination.limit} 条
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据更新</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              每5分钟自动更新
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            筛选和排序
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索交易对..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">交易所</label>
              <Select
                value={filters.exchange}
                onValueChange={(value) => handleFilterChange('exchange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择交易所" />
                </SelectTrigger>
                <SelectContent>
                  {EXCHANGES.map(exchange => (
                    <SelectItem key={exchange.value} value={exchange.value}>
                      {exchange.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">排序字段</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择排序字段" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">排序方式</label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">降序</SelectItem>
                  <SelectItem value="ASC">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易对表格 */}
      <Card>
        <CardHeader>
          <CardTitle>交易对列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">交易对</th>
                  <th className="text-left p-4">交易所</th>
                  <th className="text-right p-4">价格</th>
                  <th className="text-right p-4">24h涨跌</th>
                  <th className="text-right p-4">24h交易量</th>
                  <th className="text-right p-4">24h最高</th>
                  <th className="text-right p-4">24h最低</th>
                  <th className="text-center p-4">状态</th>
                  <th className="text-right p-4">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {tradingPairs.map((pair) => (
                  <tr key={`${pair.exchange}-${pair.symbol}`} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold">{pair.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {pair.base_asset}/{pair.quote_asset}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${getExchangeBadgeColor(pair.exchange)} text-white`}>
                        {pair.exchange.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-mono">
                      {formatPrice(pair.price)}
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end ${
                        pair.change_percent_24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pair.change_percent_24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(pair.change_percent_24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-sm">
                      {formatNumber(pair.volume_24h)}
                    </td>
                    <td className="p-4 text-right font-mono text-sm">
                      {formatPrice(pair.high_24h)}
                    </td>
                    <td className="p-4 text-right font-mono text-sm">
                      {formatPrice(pair.low_24h)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-sm ${getStatusColor(pair.status)}`}>
                        {pair.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm text-gray-600">
                      {new Date(pair.last_updated).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                显示 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                共 {pagination.total} 条
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  variant="outline"
                  size="sm"
                >
                  上一页
                </Button>
                
                <span className="text-sm text-gray-600">
                  第 {pagination.page} 页，共 {pagination.totalPages} 页
                </span>
                
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}