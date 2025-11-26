import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { TradingPairStorageService } from '../../../api/services/TradingPairStorageService';
import { ExchangeManager } from '../../../api/services/exchange/ExchangeManager';
import { TradingPairDataCollector } from '../../../api/services/TradingPairDataCollector';

// Mock database and external services
vi.mock('../../../api/config/database', () => ({
  pool: {
    query: vi.fn().mockImplementation((query, params) => {
      // Mock different query responses based on query type
      if (query.includes('SELECT COUNT(*)')) {
        return Promise.resolve({ rows: [{ count: '100' }] });
      }
      if (query.includes('SELECT * FROM trading_pairs')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              symbol: 'BTCUSDT',
              base_asset: 'BTC',
              quote_asset: 'USDT',
              exchange: 'binance',
              price: 50000,
              volume_24h: 1000000,
              high_24h: 51000,
              low_24h: 49000,
              change_24h: 1000,
              change_percent_24h: 2,
              status: 'TRADING',
              last_updated: new Date().toISOString()
            }
          ],
          rowCount: 1
        });
      }
      if (query.includes('INSERT INTO trading_pairs')) {
        return Promise.resolve({ rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    })
  }
}));

vi.mock('../../../api/services/exchange/ExchangeManager');
vi.mock('../../../api/services/TradingPairDataCollector');

// Create test server
function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Import and use trading pairs routes
  const tradingPairsRouter = require('../../../api/routes/tradingPairs').default;
  app.use('/api/trading-pairs', tradingPairsRouter);

  return app;
}

describe('Trading Pairs E2E Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(() => {
    app = createTestApp();
    server = createServer(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('GET /api/trading-pairs/trading-pairs', () => {
    it('should return trading pairs with default pagination', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number)
        }),
        timestamp: expect.any(String)
      });

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toMatchObject({
        symbol: expect.any(String),
        base_asset: expect.any(String),
        quote_asset: expect.any(String),
        exchange: expect.any(String),
        price: expect.any(Number),
        volume_24h: expect.any(Number),
        high_24h: expect.any(Number),
        low_24h: expect.any(Number),
        change_24h: expect.any(Number),
        change_percent_24h: expect.any(Number),
        status: expect.any(String),
        last_updated: expect.any(String)
      });
    });

    it('should filter by exchange', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs?exchange=binance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should search by symbol', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs?search=BTC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should sort by different fields', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs?sortBy=volume_24h&sortOrder=DESC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/trading-pairs/trading-pairs/:symbol', () => {
    it('should return specific trading pair', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs/BTCUSDT')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          symbol: 'BTCUSDT',
          base_asset: 'BTC',
          quote_asset: 'USDT'
        }),
        timestamp: expect.any(String)
      });
    });

    it('should return 404 for non-existent trading pair', async () => {
      // Override mock for this specific test
      const { pool } = require('../../../api/config/database');
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs/INVALID')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Trading pair not found'
      });
    });
  });

  describe('GET /api/trading-pairs/exchange/:exchange', () => {
    it('should return trading pairs for specific exchange', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/exchange/binance')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        timestamp: expect.any(String)
      });

      if (response.body.data.length > 0) {
        expect(response.body.data[0].exchange).toBe('binance');
      }
    });
  });

  describe('POST /api/trading-pairs/update', () => {
    it('should trigger manual data update', async () => {
      const response = await request(app)
        .post('/api/trading-pairs/update')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Data update triggered successfully',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/trading-pairs/collector/status', () => {
    it('should return collector status', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/collector/status')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          isRunning: expect.any(Boolean),
          lastCollection: expect.any(String),
          totalCollections: expect.any(Number),
          successfulCollections: expect.any(Number),
          failedCollections: expect.any(Number),
          pairsCollected: expect.any(Number),
          averageCollectionTime: expect.any(Number)
        }),
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/trading-pairs/statistics', () => {
    it('should return trading pair statistics', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/statistics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalPairs: expect.any(Number),
          totalExchanges: expect.any(Number),
          averagePrice: expect.any(Number),
          totalVolume: expect.any(Number),
          latestUpdate: expect.any(String)
        }),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { pool } = require('../../../api/config/database');
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should handle invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs?page=invalid&limit=invalid')
        .expect(200); // Should still return data with defaults

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large pagination requests', async () => {
      const response = await request(app)
        .get('/api/trading-pairs/trading-pairs?limit=1000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should respond within acceptable time limit', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/trading-pairs/trading-pairs')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});