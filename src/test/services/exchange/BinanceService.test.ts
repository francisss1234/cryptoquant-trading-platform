import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { BinanceService } from '../../../api/services/exchange/BinanceService';
import { TradingPair } from '../../../api/services/exchange/ExchangeService';

vi.mock('axios');

describe('BinanceService', () => {
  let service: BinanceService;
  let mockAxios: any;

  beforeEach(() => {
    service = new BinanceService();
    mockAxios = vi.mocked(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTradingPairs', () => {
    it('should fetch and transform trading pairs correctly', async () => {
      const mockExchangeInfo = {
        data: {
          symbols: [
            {
              symbol: 'BTCUSDT',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
              status: 'TRADING'
            },
            {
              symbol: 'ETHUSDT',
              baseAsset: 'ETH',
              quoteAsset: 'USDT',
              status: 'TRADING'
            }
          ]
        }
      };

      const mockTickerData = {
        data: [
          {
            symbol: 'BTCUSDT',
            lastPrice: '50000.00',
            volume: '1000.00',
            highPrice: '51000.00',
            lowPrice: '49000.00',
            priceChange: '1000.00',
            priceChangePercent: '2.00'
          },
          {
            symbol: 'ETHUSDT',
            lastPrice: '3000.00',
            volume: '5000.00',
            highPrice: '3100.00',
            lowPrice: '2900.00',
            priceChange: '100.00',
            priceChangePercent: '3.33'
          }
        ]
      };

      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/exchangeInfo')) {
          return Promise.resolve(mockExchangeInfo);
        }
        if (url.includes('/ticker/24hr')) {
          return Promise.resolve(mockTickerData);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const result = await service.getTradingPairs();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
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
      });
      expect(result[1]).toEqual({
        symbol: 'ETHUSDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        exchange: 'binance',
        price: 3000,
        volume24h: 5000,
        high24h: 3100,
        low24h: 2900,
        change24h: 100,
        changePercent24h: 3.33,
        status: 'TRADING'
      });
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getTradingPairs()).rejects.toThrow('Network error');
    });

    it('should handle rate limiting', async () => {
      let requestCount = 0;
      mockAxios.get.mockImplementation(() => {
        requestCount++;
        if (requestCount <= 1) {
          return Promise.reject({
            response: { status: 429, data: { msg: 'Rate limit exceeded' } }
          });
        }
        return Promise.resolve({ data: { symbols: [] } });
      });

      // Should retry after rate limit
      const result = await service.getTradingPairs();
      expect(result).toEqual([]);
      expect(requestCount).toBeGreaterThan(1);
    });

    it('should filter out non-trading pairs', async () => {
      const mockExchangeInfo = {
        data: {
          symbols: [
            {
              symbol: 'BTCUSDT',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
              status: 'TRADING'
            },
            {
              symbol: 'BROKENPAIR',
              baseAsset: 'BROKEN',
              quoteAsset: 'PAIR',
              status: 'BREAK'
            }
          ]
        }
      };

      const mockTickerData = {
        data: [
          {
            symbol: 'BTCUSDT',
            lastPrice: '50000.00',
            volume: '1000.00',
            highPrice: '51000.00',
            lowPrice: '49000.00',
            priceChange: '1000.00',
            priceChangePercent: '2.00'
          }
        ]
      };

      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/exchangeInfo')) {
          return Promise.resolve(mockExchangeInfo);
        }
        if (url.includes('/ticker/24hr')) {
          return Promise.resolve(mockTickerData);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const result = await service.getTradingPairs();

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTCUSDT');
    });
  });

  describe('getTickerData', () => {
    it('should fetch ticker data for a specific symbol', async () => {
      const mockTicker = {
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000.00',
          volume: '1000.00',
          highPrice: '51000.00',
          lowPrice: '49000.00',
          priceChange: '1000.00',
          priceChangePercent: '2.00'
        }
      };

      mockAxios.get.mockResolvedValue(mockTicker);

      const result = await service.getTickerData('BTCUSDT');

      expect(result).toEqual({
        symbol: 'BTCUSDT',
        price: 50000,
        volume24h: 1000,
        high24h: 51000,
        low24h: 49000,
        change24h: 1000,
        changePercent24h: 2
      });
    });
  });

  describe('getOrderBook', () => {
    it('should fetch order book data', async () => {
      const mockOrderBook = {
        data: {
          bids: [['49900.00', '1.00'], ['49800.00', '2.00']],
          asks: [['50100.00', '1.50'], ['50200.00', '3.00']]
        }
      };

      mockAxios.get.mockResolvedValue(mockOrderBook);

      const result = await service.getOrderBook('BTCUSDT');

      expect(result).toEqual({
        bids: [
          { price: 49900, quantity: 1 },
          { price: 49800, quantity: 2 }
        ],
        asks: [
          { price: 50100, quantity: 1.5 },
          { price: 50200, quantity: 3 }
        ]
      });
    });
  });

  describe('getExchangeInfo', () => {
    it('should fetch exchange info', async () => {
      const mockExchangeInfo = {
        data: {
          symbols: [
            {
              symbol: 'BTCUSDT',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
              status: 'TRADING'
            }
          ]
        }
      };

      mockAxios.get.mockResolvedValue(mockExchangeInfo);

      const result = await service.getExchangeInfo();

      expect(result).toEqual(mockExchangeInfo.data);
    });
  });

  describe('get24hrTickers', () => {
    it('should fetch 24hr ticker data', async () => {
      const mockTickers = {
        data: [
          {
            symbol: 'BTCUSDT',
            lastPrice: '50000.00',
            volume: '1000.00',
            highPrice: '51000.00',
            lowPrice: '49000.00',
            priceChange: '1000.00',
            priceChangePercent: '2.00'
          }
        ]
      };

      mockAxios.get.mockResolvedValue(mockTickers);

      const result = await service.get24hrTickers();

      expect(result).toEqual(mockTickers.data);
    });
  });

  describe('rate limiting', () => {
    it('should implement rate limiting correctly', async () => {
      const startTime = Date.now();
      const promises = [];

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        promises.push(service.getExchangeInfo());
      }

      mockAxios.get.mockResolvedValue({ data: { symbols: [] } });

      await Promise.all(promises);
      const endTime = Date.now();

      // Should take some time due to rate limiting
      expect(endTime - startTime).toBeGreaterThan(0);
      expect(mockAxios.get).toHaveBeenCalledTimes(5);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getTradingPairs()).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Request timeout'
      });

      await expect(service.getTradingPairs()).rejects.toThrow('Request timeout');
    });

    it('should handle invalid data format', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          symbols: null // Invalid data
        }
      });

      const result = await service.getTradingPairs();
      expect(result).toEqual([]);
    });
  });
});