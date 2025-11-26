import { TradingPair } from '../exchange/ExchangeService';
import { pool } from '../../config/database';
import { logger } from '../../utils/logger';

export interface TradingPairDB {
  id?: number;
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
  bid_quantity?: number;
  ask_quantity?: number;
  status: string;
  min_qty?: number;
  max_qty?: number;
  step_size?: number;
  min_notional?: number;
  last_updated: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class TradingPairStorageService {
  private batchSize: number = 100;

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize;
  }

  // 初始化交易对表
  async initializeTable(): Promise<void> {
    try {
      logger.info('🚀 初始化交易对数据表...');

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS trading_pairs (
          id SERIAL PRIMARY KEY,
          symbol VARCHAR(50) NOT NULL,
          base_asset VARCHAR(20) NOT NULL,
          quote_asset VARCHAR(20) NOT NULL,
          exchange VARCHAR(50) NOT NULL,
          price DECIMAL(18,8) NOT NULL DEFAULT 0,
          volume_24h DECIMAL(18,8) NOT NULL DEFAULT 0,
          high_24h DECIMAL(18,8) NOT NULL DEFAULT 0,
          low_24h DECIMAL(18,8) NOT NULL DEFAULT 0,
          change_24h DECIMAL(18,8) NOT NULL DEFAULT 0,
          change_percent_24h DECIMAL(8,4) NOT NULL DEFAULT 0,
          bid_price DECIMAL(18,8),
          ask_price DECIMAL(18,8),
          bid_quantity DECIMAL(18,8),
          ask_quantity DECIMAL(18,8),
          status VARCHAR(20) NOT NULL DEFAULT 'TRADING',
          min_qty DECIMAL(18,8),
          max_qty DECIMAL(18,8),
          step_size DECIMAL(18,8),
          min_notional DECIMAL(18,8),
          last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(symbol, exchange)
        );
      `;

      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_exchange ON trading_pairs(exchange);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_base_asset ON trading_pairs(base_asset);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_quote_asset ON trading_pairs(quote_asset);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_status ON trading_pairs(status);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_volume_24h ON trading_pairs(volume_24h DESC);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_price ON trading_pairs(price DESC);',
        'CREATE INDEX IF NOT EXISTS idx_trading_pairs_last_updated ON trading_pairs(last_updated DESC);'
      ];

      await pool.query(createTableQuery);
      
      for (const indexQuery of createIndexes) {
        await pool.query(indexQuery);
      }

      logger.info('✅ 交易对数据表初始化完成');
    } catch (error) {
      logger.error('❌ 交易对数据表初始化失败:', error);
      throw error;
    }
  }

  // 将TradingPair转换为数据库格式
  private convertToDBFormat(pair: TradingPair): TradingPairDB {
    return {
      symbol: pair.symbol,
      base_asset: pair.baseAsset,
      quote_asset: pair.quoteAsset,
      exchange: pair.exchange,
      price: pair.price,
      volume_24h: pair.volume24h,
      high_24h: pair.high24h,
      low_24h: pair.low24h,
      change_24h: pair.change24h,
      change_percent_24h: pair.changePercent24h,
      bid_price: pair.bidPrice,
      ask_price: pair.askPrice,
      bid_quantity: pair.bidQuantity,
      ask_quantity: pair.askQuantity,
      status: pair.status,
      min_qty: pair.minQty,
      max_qty: pair.maxQty,
      step_size: pair.stepSize,
      min_notional: pair.minNotional,
      last_updated: pair.lastUpdated
    };
  }

  // 批量插入或更新交易对数据
  async upsertTradingPairs(pairs: TradingPair[]): Promise<number> {
    if (!pairs || pairs.length === 0) {
      logger.warn('⚠️ 没有交易对数据需要处理');
      return 0;
    }

    try {
      logger.info(`🔄 开始批量处理 ${pairs.length} 个交易对数据...`);

      const dbPairs = pairs.map(pair => this.convertToDBFormat(pair));
      let processedCount = 0;

      // 分批处理
      for (let i = 0; i < dbPairs.length; i += this.batchSize) {
        const batch = dbPairs.slice(i, i + this.batchSize);
        const batchCount = await this.upsertBatch(batch);
        processedCount += batchCount;
        
        logger.info(`📊 已处理 ${processedCount}/${pairs.length} 个交易对`);
      }

      logger.info(`✅ 成功处理 ${processedCount} 个交易对数据`);
      return processedCount;
    } catch (error) {
      logger.error('❌ 批量处理交易对数据失败:', error);
      throw error;
    }
  }

  // 批量插入或更新
  private async upsertBatch(pairs: TradingPairDB[]): Promise<number> {
    if (pairs.length === 0) return 0;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const upsertQuery = `
        INSERT INTO trading_pairs (
          symbol, base_asset, quote_asset, exchange, price, volume_24h, 
          high_24h, low_24h, change_24h, change_percent_24h,
          bid_price, ask_price, bid_quantity, ask_quantity,
          status, min_qty, max_qty, step_size, min_notional, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (symbol, exchange) DO UPDATE SET
          price = EXCLUDED.price,
          volume_24h = EXCLUDED.volume_24h,
          high_24h = EXCLUDED.high_24h,
          low_24h = EXCLUDED.low_24h,
          change_24h = EXCLUDED.change_24h,
          change_percent_24h = EXCLUDED.change_percent_24h,
          bid_price = EXCLUDED.bid_price,
          ask_price = EXCLUDED.ask_price,
          bid_quantity = EXCLUDED.bid_quantity,
          ask_quantity = EXCLUDED.ask_quantity,
          status = EXCLUDED.status,
          min_qty = EXCLUDED.min_qty,
          max_qty = EXCLUDED.max_qty,
          step_size = EXCLUDED.step_size,
          min_notional = EXCLUDED.min_notional,
          last_updated = EXCLUDED.last_updated,
          updated_at = CURRENT_TIMESTAMP
      `;

      let upsertedCount = 0;

      for (const pair of pairs) {
        const values = [
          pair.symbol,
          pair.base_asset,
          pair.quote_asset,
          pair.exchange,
          pair.price,
          pair.volume_24h,
          pair.high_24h,
          pair.low_24h,
          pair.change_24h,
          pair.change_percent_24h,
          pair.bid_price,
          pair.ask_price,
          pair.bid_quantity,
          pair.ask_quantity,
          pair.status,
          pair.min_qty,
          pair.max_qty,
          pair.step_size,
          pair.min_notional,
          pair.last_updated
        ];

        const result = await client.query(upsertQuery, values);
        upsertedCount += result.rowCount || 0;
      }

      await client.query('COMMIT');
      return upsertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ 批量插入/更新失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 获取交易对数据（支持分页和过滤）
  async getTradingPairs(options: {
    exchange?: string;
    baseAsset?: string;
    quoteAsset?: string;
    status?: string;
    symbol?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ data: TradingPairDB[]; total: number; page: number; limit: number }> {
    const {
      exchange,
      baseAsset,
      quoteAsset,
      status,
      symbol,
      search,
      page = 1,
      limit = 50,
      sortBy = 'volume_24h',
      sortOrder = 'DESC'
    } = options;

    try {
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      // 构建WHERE条件
      if (exchange) {
        whereConditions.push(`exchange = $${paramIndex++}`);
        params.push(exchange);
      }
      if (baseAsset) {
        whereConditions.push(`base_asset = $${paramIndex++}`);
        params.push(baseAsset);
      }
      if (quoteAsset) {
        whereConditions.push(`quote_asset = $${paramIndex++}`);
        params.push(quoteAsset);
      }
      if (status) {
        whereConditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }
      if (symbol) {
        whereConditions.push(`symbol = $${paramIndex++}`);
        params.push(symbol);
      }
      if (search) {
        whereConditions.push(`(symbol ILIKE $${paramIndex++} OR base_asset ILIKE $${paramIndex++} OR quote_asset ILIKE $${paramIndex++})`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM trading_pairs ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // 获取分页数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM trading_pairs 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const dataResult = await pool.query(dataQuery, params);

      return {
        data: dataResult.rows,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('❌ 获取交易对数据失败:', error);
      throw error;
    }
  }

  // 获取单个交易对
  async getTradingPair(symbol: string, exchange: string): Promise<TradingPairDB | null> {
    try {
      const query = 'SELECT * FROM trading_pairs WHERE symbol = $1 AND exchange = $2';
      const result = await pool.query(query, [symbol, exchange]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`❌ 获取交易对 ${symbol}@${exchange} 失败:`, error);
      throw error;
    }
  }

  // 获取热门交易对（按交易量排序）
  async getTopTradingPairs(limit: number = 20, exchange?: string): Promise<TradingPairDB[]> {
    try {
      let query = `
        SELECT * FROM trading_pairs 
        WHERE status = 'TRADING'
      `;
      const params: any[] = [];

      if (exchange) {
        query += ' AND exchange = $1';
        params.push(exchange);
      }

      query += ' ORDER BY volume_24h DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ 获取热门交易对失败:', error);
      throw error;
    }
  }

  // 获取数据更新时间统计
  async getUpdateStats(): Promise<{ lastUpdate: Date; totalPairs: number; byExchange: any[] }> {
    try {
      // 获取最新更新时间
      const lastUpdateQuery = 'SELECT MAX(last_updated) as last_update FROM trading_pairs';
      const lastUpdateResult = await pool.query(lastUpdateQuery);
      const lastUpdate = lastUpdateResult.rows[0]?.last_update || new Date();

      // 获取总数
      const totalQuery = 'SELECT COUNT(*) as total FROM trading_pairs';
      const totalResult = await pool.query(totalQuery);
      const totalPairs = parseInt(totalResult.rows[0].total);

      // 按交易所统计
      const byExchangeQuery = `
        SELECT exchange, COUNT(*) as count, MAX(last_updated) as last_update
        FROM trading_pairs 
        GROUP BY exchange 
        ORDER BY count DESC
      `;
      const byExchangeResult = await pool.query(byExchangeQuery);

      return {
        lastUpdate: new Date(lastUpdate),
        totalPairs,
        byExchange: byExchangeResult.rows
      };
    } catch (error) {
      logger.error('❌ 获取更新统计失败:', error);
      throw error;
    }
  }

  // 清理过期数据（超过24小时未更新的数据）
  async cleanupExpiredData(maxAgeHours: number = 24): Promise<number> {
    try {
      const query = `
        DELETE FROM trading_pairs 
        WHERE last_updated < NOW() - INTERVAL '${maxAgeHours} hours'
        RETURNING *
      `;
      
      const result = await pool.query(query);
      const deletedCount = result.rowCount || 0;
      
      logger.info(`🧹 清理了 ${deletedCount} 个过期交易对数据`);
      return deletedCount;
    } catch (error) {
      logger.error('❌ 清理过期数据失败:', error);
      throw error;
    }
  }

  // 数据去重和验证
  async validateAndDeduplicate(pairs: TradingPair[]): Promise<TradingPair[]> {
    const validPairs: TradingPair[] = [];
    const seen = new Set<string>();

    for (const pair of pairs) {
      // 基本验证
      if (!pair.symbol || !pair.baseAsset || !pair.quoteAsset) {
        logger.warn(`⚠️ 交易对数据验证失败: 缺少必要字段`, pair);
        continue;
      }

      // 价格验证
      if (pair.price < 0) {
        logger.warn(`⚠️ 交易对 ${pair.symbol} 价格无效: ${pair.price}`);
        continue;
      }

      // 交易量验证
      if (pair.volume24h < 0) {
        logger.warn(`⚠️ 交易对 ${pair.symbol} 交易量无效: ${pair.volume24h}`);
        continue;
      }

      // 去重检查
      const key = `${pair.symbol}@${pair.exchange}`;
      if (seen.has(key)) {
        logger.warn(`⚠️ 重复的交易对: ${key}`);
        continue;
      }

      seen.add(key);
      validPairs.push(pair);
    }

    logger.info(`✅ 数据验证完成: ${validPairs.length}/${pairs.length} 个有效交易对`);
    return validPairs;
  }
}