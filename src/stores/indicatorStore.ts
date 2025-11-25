import { create } from 'zustand';
import { calculateMultipleIndicators } from '../utils/indicators';

export interface Indicator {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, number>;
  isActive: boolean;
  color: string;
}

export interface IndicatorResult {
  timestamp: number;
  value: number;
  signal?: string;
}

interface IndicatorStoreState {
  // 指标配置
  indicators: Indicator[];
  
  // 计算结果
  indicatorResults: Record<string, IndicatorResult[]>;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // 方法
  addIndicator: (indicator: Omit<Indicator, 'id'>) => void;
  removeIndicator: (id: string) => void;
  updateIndicator: (id: string, updates: Partial<Indicator>) => void;
  setIndicatorResults: (indicatorId: string, results: IndicatorResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API 方法
  fetchIndicatorData: (exchange: string, symbol: string, timeframe: string, indicator: Indicator) => Promise<void>;
  fetchMultipleIndicators: (exchange: string, symbol: string, timeframe: string) => Promise<void>;
  getAvailableIndicators: () => Promise<void>;
}

export const useIndicatorStore = create<IndicatorStoreState>((set, get) => ({
  // 初始状态
  indicators: [
    {
      id: '1',
      name: 'MA20',
      type: 'SMA',
      parameters: { period: 20 },
      isActive: true,
      color: '#3b82f6'
    },
    {
      id: '2', 
      name: 'RSI14',
      type: 'RSI',
      parameters: { period: 14 },
      isActive: true,
      color: '#10b981'
    }
  ],
  indicatorResults: {},
  isLoading: false,
  error: null,

  // 设置方法
  addIndicator: (indicator) => {
    const newIndicator = {
      ...indicator,
      id: Date.now().toString()
    };
    set((state) => ({
      indicators: [...state.indicators, newIndicator]
    }));
  },

  removeIndicator: (id) => {
    set((state) => ({
      indicators: state.indicators.filter(ind => ind.id !== id),
      indicatorResults: {
        ...state.indicatorResults,
        [id]: undefined
      }
    }));
  },

  updateIndicator: (id, updates) => {
    set((state) => ({
      indicators: state.indicators.map(ind => 
        ind.id === id ? { ...ind, ...updates } : ind
      )
    }));
  },

  setIndicatorResults: (indicatorId, results) => {
    set((state) => ({
      indicatorResults: {
        ...state.indicatorResults,
        [indicatorId]: results
      }
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // API 方法
  fetchIndicatorData: async (exchange, symbol, timeframe, indicator) => {
    const { setLoading, setError, setIndicatorResults } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/indicators/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exchange,
          symbol,
          timeframe,
          indicatorType: indicator.type,
          params: indicator.parameters
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取指标数据失败');
      }
      
      const indicatorData = result.data.data.map((item: any) => ({
        timestamp: item.timestamp,
        value: item.indicatorValue,
        signal: item.signal
      }));
      
      setIndicatorResults(indicator.id, indicatorData);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取指标数据失败');
      console.error('获取指标数据失败:', error);
    } finally {
      setLoading(false);
    }
  },

  fetchMultipleIndicators: async (exchange, symbol, timeframe) => {
    const { indicators, setLoading, setError, setIndicatorResults } = get();
    const activeIndicators = indicators.filter(ind => ind.isActive);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/indicators/multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exchange,
          symbol,
          timeframe,
          indicators: activeIndicators.map(ind => ({
            type: ind.type,
            name: ind.name,
            params: ind.parameters
          }))
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取多指标数据失败');
      }
      
      // 处理每个指标的结果
      activeIndicators.forEach(indicator => {
        const indicatorData = result.data.combinedData.map((item: any) => ({
          timestamp: item.timestamp,
          value: item[indicator.name],
          signal: item[`${indicator.name}_signal`]
        }));
        
        setIndicatorResults(indicator.id, indicatorData);
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取多指标数据失败');
      console.error('获取多指标数据失败:', error);
    } finally {
      setLoading(false);
    }
  },

  getAvailableIndicators: async () => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/indicators/list');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取可用指标列表失败');
      }
      
      return result.data;
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取可用指标列表失败');
      console.error('获取可用指标列表失败:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }
}));