import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExchangeManager } from '../../../api/services/exchange/ExchangeManager';
import { BinanceService } from '../../../api/services/exchange/BinanceService';
import { CoinbaseService } from '../../../api/services/exchange/CoinbaseService';
import { OKXService } from '../../../api/services/exchange/OKXService';
import { TradingPair } from '../../../api/services/exchange/ExchangeService';

vi.mock('../../../api/services/exchange/BinanceService');
vi.mock('../../../api/services/exchange/CoinbaseService');
vi.mock('../../../api/services/exchange/OKXService');

describe('ExchangeManager', () => {
  let manager: ExchangeManager;
  let mockBinanceService: any;
  let mockCoinbaseService: any;
  let mockOKXService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockBinanceService = {
      getTradingPairs: vi.fn(),
      getHealthStatus: vi.fn().mockResolvedValue({ status: 'healthy' }),
      isEnabled: true
    };
    
    mockCoinbaseService = {
      getTradingPairs: vi.fn(),
      getHealthStatus: vi.fn().mockResolvedValue({ status: 'healthy' }),
      isEnabled: true
    };
    
    mockOKXService = {
      getTradingPairs: vi.fn(),
      getHealthStatus: vi.fn().mockResolvedValue({ status: 'healthy' }),
      isEnabled: true
    };

    (BinanceService as any).mockImplementation(() => mockBinanceService);
    (CoinbaseService as any).mockImplementation(() => mockCoinbaseService);
    (OKXService as any).mockImplementation(() => mockOKXService);

    manager = new ExchangeManager();
  });

  describe('getAllTradingPairs', () => {
    it('should aggregate trading pairs from all exchanges', async () => {
      const mockBinancePairs: TradingPair[] = [
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchange: 'binance',
          price: 50000,
          volume24h: 1000,
          high24h: 51000,
          low24h: 49000,
          change24h: 1000,
          changePercent24h: 2,
          status: 'TRADING'
        }
      ];

      const mockCoinbasePairs: TradingPair[] = [
        {
          symbol: 'ETHUSD',
          baseAsset: 'ETH',
          quoteAsset: 'USD',
          exchange: 'coinbase',
          price: 3000,
          volume24h: 500,
          high24h: 3100,
          low24h: 2900,
          change24h: 100,
          changePercent24h: 3.33,
          status: 'TRADING'
        }
      ];

      const mockOKXPairs: TradingPair[] = [
        {
          symbol: 'ADAUSDT',
          baseAsset: 'ADA',
          quoteAsset: 'USDT',
          exchange: 'okx',
          price: 1.5,
          volume24h: 2000,
          high24h: 1.6,
          low24h: 1.4,
          change24h: 0.1,
          changePercent24h: 6.67,
          status: 'TRADING'
        }
      ];

      mockBinanceService.getTradingPairs.mockResolvedValue(mockBinancePairs);
      mockCoinbaseService.getTradingPairs.mockResolvedValue(mockCoinbasePairs);
      mockOKXService.getTradingPairs.mockResolvedValue(mockOKXPairs);

      const result = await manager.getAllTradingPairs();

      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining([
        ...mockBinancePairs,
        ...mockCoinbasePairs,
        ...mockOKXPairs
      ]));
    });

    it('should handle partial failures gracefully', async () => {
      const mockBinancePairs: TradingPair[] = [
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchange: 'binance',
          price: 50000,
          volume24h: 1000,
          high24h: 51000,
          low24h: 49000,
          change24h: 1000,
          changePercent24h: 2,
          status: 'TRADING'
        }
      ];

      mockBinanceService.getTradingPairs.mockResolvedValue(mockBinancePairs);
      mockCoinbaseService.getTradingPairs.mockRejectedValue(new Error('Coinbase API error'));
      mockOKXService.getTradingPairs.mockResolvedValue([]);

      const result = await manager.getAllTradingPairs();

      expect(result).toHaveLength(1);
      expect(result[0].exchange).toBe('binance');
    });

    it('should handle all exchanges failing', async () => {
      mockBinanceService.getTradingPairs.mockRejectedValue(new Error('Binance API error'));
      mockCoinbaseService.getTradingPairs.mockRejectedValue(new Error('Coinbase API error'));
      mockOKXService.getTradingPairs.mockRejectedValue(new Error('OKX API error'));

      const result = await manager.getAllTradingPairs();

      expect(result).toEqual([]);
    });

    it('should deduplicate trading pairs across exchanges', async () => {
      const mockPairs: TradingPair[] = [
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchange: 'binance',
          price: 50000,
          volume24h: 1000,
          high24h: 51000,
          low24h: 49000,
          change24h: 1000,
          changePercent24h: 2,
          status: 'TRADING'
        },
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchange: 'coinbase',
          price: 50100,
          volume24h: 800,
          high24h: 51100,
          low24h: 49100,
          change24h: 1100,
          changePercent24h: 2.2,
          status: 'TRADING'
        }
      ];

      mockBinanceService.getTradingPairs.mockResolvedValue([mockPairs[0]]);
      mockCoinbaseService.getTradingPairs.mockResolvedValue([mockPairs[1]]);
      mockOKXService.getTradingPairs.mockResolvedValue([]);

      const result = await manager.getAllTradingPairs();

      expect(result).toHaveLength(2);
      expect(result[0].exchange).toBe('binance');
      expect(result[1].exchange).toBe('coinbase');
    });
  });

  describe('getExchangeHealth', () => {
    it('should return health status of all exchanges', async () => {
      const mockHealthStatus = {
        binance: { status: 'healthy' },
        coinbase: { status: 'healthy' },
        okx: { status: 'healthy' }
      };

      const result = await manager.getExchangeHealth();

      expect(result).toEqual(mockHealthStatus);
      expect(mockBinanceService.getHealthStatus).toHaveBeenCalled();
      expect(mockCoinbaseService.getHealthStatus).toHaveBeenCalled();
      expect(mockOKXService.getHealthStatus).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      mockBinanceService.getHealthStatus.mockRejectedValue(new Error('Health check failed'));
      mockCoinbaseService.getHealthStatus.mockResolvedValue({ status: 'healthy' });
      mockOKXService.getHealthStatus.mockResolvedValue({ status: 'healthy' });

      const result = await manager.getExchangeHealth();

      expect(result.binance.status).toBe('unhealthy');
      expect(result.coinbase.status).toBe('healthy');
      expect(result.okx.status).toBe('healthy');
    });
  });

  describe('getEnabledServices', () => {
    it('should return only enabled services', () => {
      mockBinanceService.isEnabled = true;
      mockCoinbaseService.isEnabled = false;
      mockOKXService.isEnabled = true;

      const result = manager.getEnabledServices();

      expect(result).toHaveLength(2);
      expect(result.map(s => s.exchange)).toEqual(['binance', 'okx']);
    });
  });

  describe('enableExchange', () => {
    it('should enable a specific exchange', () => {
      mockBinanceService.isEnabled = false;

      manager.enableExchange('binance');

      expect(mockBinanceService.isEnabled).toBe(true);
    });

    it('should not throw error for non-existent exchange', () => {
      expect(() => manager.enableExchange('nonexistent')).not.toThrow();
    });
  });

  describe('disableExchange', () => {
    it('should disable a specific exchange', () => {
      mockBinanceService.isEnabled = true;

      manager.disableExchange('binance');

      expect(mockBinanceService.isEnabled).toBe(false);
    });

    it('should not throw error for non-existent exchange', () => {
      expect(() => manager.disableExchange('nonexistent')).not.toThrow();
    });
  });

  describe('getExchangeByName', () => {
    it('should return the correct exchange service', () => {
      const result = manager.getExchangeByName('binance');

      expect(result).toBe(mockBinanceService);
    });

    it('should return null for non-existent exchange', () => {
      const result = manager.getExchangeByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle service initialization errors', () => {
      (BinanceService as any).mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      expect(() => new ExchangeManager()).not.toThrow();
    });

    it('should handle concurrent requests safely', async () => {
      const mockPairs: TradingPair[] = [
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchange: 'binance',
          price: 50000,
          volume24h: 1000,
          high24h: 51000,
          low24h: 49000,
          change24h: 1000,
          changePercent24h: 2,
          status: 'TRADING'
        }
      ];

      mockBinanceService.getTradingPairs.mockResolvedValue(mockPairs);
      mockCoinbaseService.getTradingPairs.mockResolvedValue([]);
      mockOKXService.getTradingPairs.mockResolvedValue([]);

      // Make multiple concurrent requests
      const promises = Array(10).fill(null).map(() => manager.getAllTradingPairs());
      const results = await Promise.all(promises);

      // All results should be the same
      results.forEach(result => {
        expect(result).toEqual(mockPairs);
      });
    });
  });
});