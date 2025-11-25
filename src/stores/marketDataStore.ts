import { create } from 'zustand';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookData {
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

interface MarketDataState {
  // 实时数据
  marketData: Record<string, MarketData>;
  klineData: Record<string, KlineData[]>;
  orderBookData: Record<string, OrderBookData>;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // 选择的交易对
  selectedExchange: string;
  selectedSymbol: string;
  selectedTimeframe: string;
  
  // 方法
  setMarketData: (symbol: string, data: MarketData) => void;
  setKlineData: (symbol: string, data: KlineData[]) => void;
  setOrderBookData: (symbol: string, data: OrderBookData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedExchange: (exchange: string) => void;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedTimeframe: (timeframe: string) => void;
  
  // API 调用方法
  fetchTicker: (exchange: string, symbol: string) => Promise<void>;
  fetchKlineData: (exchange: string, symbol: string, timeframe: string, limit?: number) => Promise<void>;
  fetchOrderBook: (exchange: string, symbol: string) => Promise<void>;
  syncHistoricalData: (exchange: string, symbol: string, timeframe: string) => Promise<void>;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  // 初始状态
  marketData: {},
  klineData: {},
  orderBookData: {},
  isLoading: false,
  error: null,
  selectedExchange: 'binance',
  selectedSymbol: 'BTC/USDT',
  selectedTimeframe: '1h',

  // 设置方法
  setMarketData: (symbol, data) => set((state) => ({
    marketData: { ...state.marketData, [symbol]: data }
  })),

  setKlineData: (symbol, data) => set((state) => ({
    klineData: { ...state.klineData, [symbol]: data }
  })),

  setOrderBookData: (symbol, data) => set((state) => ({
    orderBookData: { ...state.orderBookData, [symbol]: data }
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

  // API 方法
  fetchTicker: async (exchange, symbol) => {
    const { setLoading, setError, setMarketData } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/market/ticker/${exchange}/${symbol}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取行情数据失败');
      }
      
      const ticker = result.data;
      const marketData: MarketData = {
        symbol,
        price: ticker.last,
        change24h: ticker.change,
        volume24h: ticker.baseVolume,
        high24h: ticker.high,
        low24h: ticker.low,
        timestamp: ticker.timestamp
      };
      
      setMarketData(symbol, marketData);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取行情数据失败');
      console.error('获取行情数据失败:', error);
    } finally {
      setLoading(false);
    }
  },

  fetchKlineData: async (exchange, symbol, timeframe, limit = 100) => {
    const { setLoading, setError, setKlineData } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/market/ohlcv/${exchange}/${symbol}?timeframe=${timeframe}&limit=${limit}`
      );
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取K线数据失败');
      }
      
      const ohlcv = result.data;
      const klineData: KlineData[] = ohlcv.map((candle: any[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
      
      setKlineData(symbol, klineData);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取K线数据失败');
      console.error('获取K线数据失败:', error);
    } finally {
      setLoading(false);
    }
  },

  fetchOrderBook: async (exchange, symbol) => {
    const { setLoading, setError, setOrderBookData } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/market/orderbook/${exchange}/${symbol}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取订单簿数据失败');
      }
      
      const orderBook = result.data;
      const orderBookData: OrderBookData = {
        bids: orderBook.bids,
        asks: orderBook.asks,
        timestamp: orderBook.timestamp
      };
      
      setOrderBookData(symbol, orderBookData);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取订单簿数据失败');
      console.error('获取订单簿数据失败:', error);
    } finally {
      setLoading(false);
    }
  },

  syncHistoricalData: async (exchange, symbol, timeframe) => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/market/sync/${exchange}/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeframe, limit: 1000 })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '同步历史数据失败');
      }
      
      console.log(`✅ 成功同步 ${result.data.count} 条历史数据`);
    } catch (error) {
      setError(error instanceof Error ? error.message : '同步历史数据失败');
      console.error('同步历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  }
}));