import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TradingPairStorageService } from '../../../api/services/TradingPairStorageService';
import { TradingPair } from '../../../api/services/exchange/ExchangeService';

// Mock the database module
vi.mock('../../../api/config/database', () => ({
  query: vi.fn(),
  pool: {
    query: vi.fn()
  }
}));

describe('TradingPairStorageService', () => {
  let service: TradingPairStorageService;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TradingPairStorageService();
    mockQuery = vi.fn();
    
    // Mock the database query method
    const { pool } = require('../../../api/config/database');
    pool.query = mockQuery;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('upsertTradingPairs', () => {
    it('should insert new trading pairs successfully', async () => {
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

      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await service.upsertTradingPairs(mockPairs);

      expect(result).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trading_pairs'),
        expect.arrayContaining([
          'BTCUSDT', 'BTC', 'USDT', 'binance', 50000, 1000, 51000, 49000, 1000, 2, 'TRADING'
        ])
      );
    });

    it('should handle batch inserts', async () => {
      const mockPairs: TradingPair[] = Array(150).fill(null).map((_, index) => ({
        symbol: `PAIR${index}USDT`,
        baseAsset: `PAIR${index}`,
        quoteAsset: 'USDT',
        exchange: 'binance',
        price: 100 + index,
        volume24h: 1000 + index,
        high24h: 110 + index,
        low24h: 90 + index,
        change24h: 5 + index,
        changePercent24h: 5 + index * 0.1,
        status: 'TRADING'
      }));

      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await service.upsertTradingPairs(mockPairs);

      // Should be called multiple times due to batch size limit
      expect(mockQuery).toHaveBeenCalledTimes(2); // 150 items / 100 batch size = 2 batches
      expect(result).toBe(150);
    });
  });

  describe('getTradingPairs', () => {
    it('should fetch trading pairs with pagination', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 1,
            symbol: 'BTCUSDT',
            base_asset: 'BTC',
            quote_asset: 'USDT',
            exchange: 'binance',
            price: 50000,
            volume_24h: 1000,
            high_24h: 51000,
            low_24h: 49000,
            change_24h: 1000,
            change_percent_24h: 2,
            status: 'TRADING',
            last_updated: '2023-01-01T00:00:00Z'
          }
        ],
        rowCount: 1
      };

      mockQuery.mockResolvedValue(mockDbResult);

      const result = await service.getTradingPairs({
        page: 1,
        limit: 50
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      const mockDbResult = {
        rows: [],
        rowCount: 0
      };

      mockQuery.mockResolvedValue(mockDbResult);

      await service.getTradingPairs({
        page: 1,
        limit: 50,
        search: 'BTC'
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE symbol ILIKE $3'),
        expect.arrayContaining(['%BTC%', 50, 0])
      );
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockQuery.mockRejectedValue(new Error('Connection lost'));

      await expect(service.getTradingPairs({ page: 1, limit: 50 }))
        .rejects.toThrow('Connection lost');
    });
  });
});