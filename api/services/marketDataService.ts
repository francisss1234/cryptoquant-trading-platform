import { pool } from '../config/database.js';

export interface MarketData {
  exchange: string;
  symbol: string;
  timeframe: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  tradesCount?: number;
}

export class MarketDataService {
  /**
   * 保存市场数据到数据库
   */
  async saveMarketData(data: MarketData[]): Promise<void> {
    if (data.length === 0) return;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO market_data (exchange, symbol, timeframe, timestamp, open, high, low, close, volume, quote_volume, trades_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (exchange, symbol, timeframe, timestamp) 
        DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume,
          quote_volume = EXCLUDED.quote_volume,
          trades_count = EXCLUDED.trades_count
      `;

      for (const item of data) {
        await client.query(insertQuery, [
          item.exchange,
          item.symbol,
          item.timeframe,
          item.timestamp,
          item.open,
          item.high,
          item.low,
          item.close,
          item.volume,
          item.quoteVolume || 0,
          item.tradesCount || 0
        ]);
      }

      await client.query('COMMIT');
      console.log(`✅ 成功保存 ${data.length} 条市场数据`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 保存市场数据失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取市场数据
   */
  async getMarketData(
    exchange: string, 
    symbol: string, 
    timeframe: string,
    startTime?: number,
    endTime?: number,
    limit: number = 1000
  ): Promise<MarketData[]> {
    let query = `
      SELECT * FROM market_data 
      WHERE exchange = $1 AND symbol = $2 AND timeframe = $3
    `;
    
    const params = [exchange, symbol, timeframe];
    let paramIndex = 4;

    if (startTime) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(startTime.toString());
      paramIndex++;
    }

    if (endTime) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endTime.toString());
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    params.push(limit.toString());

    try {
      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        exchange: row.exchange,
        symbol: row.symbol,
        timeframe: row.timeframe,
        timestamp: parseInt(row.timestamp),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseFloat(row.volume),
        quoteVolume: parseFloat(row.quote_volume),
        tradesCount: row.trades_count
      }));
    } catch (error) {
      console.error('❌ 获取市场数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取最新市场数据
   */
  async getLatestMarketData(exchange: string, symbol: string, timeframe: string): Promise<MarketData | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM market_data 
         WHERE exchange = $1 AND symbol = $2 AND timeframe = $3 
         ORDER BY timestamp DESC LIMIT 1`,
        [exchange, symbol, timeframe]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        exchange: row.exchange,
        symbol: row.symbol,
        timeframe: row.timeframe,
        timestamp: parseInt(row.timestamp),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseFloat(row.volume),
        quoteVolume: parseFloat(row.quote_volume),
        tradesCount: row.trades_count
      };
    } catch (error) {
      console.error('❌ 获取最新市场数据失败:', error);
      throw error;
    }
  }

  /**
   * 删除过期数据
   */
  async cleanupOldData(daysToKeep: number = 365): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    try {
      const result = await pool.query(
        'DELETE FROM market_data WHERE timestamp < $1',
        [cutoffTime]
      );
      
      console.log(`✅ 清理了 ${result.rowCount} 条过期市场数据`);
    } catch (error) {
      console.error('❌ 清理过期数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据统计信息
   */
  async getDataStats(): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT exchange) as exchanges,
          COUNT(DISTINCT symbol) as symbols,
          COUNT(DISTINCT timeframe) as timeframes,
          MIN(timestamp) as oldest_timestamp,
          MAX(timestamp) as newest_timestamp
        FROM market_data
      `);

      return result.rows[0];
    } catch (error) {
      console.error('❌ 获取数据统计失败:', error);
      throw error;
    }
  }
}

export const marketDataService = new MarketDataService();