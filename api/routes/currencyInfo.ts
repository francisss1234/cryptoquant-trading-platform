import { Router } from 'express';
import { Client } from 'pg';

const router = Router();

// 数据库连接配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'da111111',
  database: process.env.DB_NAME || 'cryptoqs'
};

/**
 * 获取币种更新统计信息
 */
router.get('/currency-update-info', async (req, res) => {
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();

    // 获取币种统计信息
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_pairs,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies,
        MAX(updated_at) as last_update
      FROM spot_pairs
      WHERE status = 'TRADING'
    `);

    // 获取主要币种分布
    const topCurrenciesResult = await client.query(`
      SELECT 
        base_asset,
        COUNT(*) as pair_count
      FROM spot_pairs
      WHERE status = 'TRADING'
      GROUP BY base_asset
      ORDER BY pair_count DESC
      LIMIT 10
    `);

    // 获取主要计价币种分布
    const quoteCurrenciesResult = await client.query(`
      SELECT 
        quote_asset,
        COUNT(*) as pair_count
      FROM spot_pairs
      WHERE status = 'TRADING'
      GROUP BY quote_asset
      ORDER BY pair_count DESC
      LIMIT 5
    `);

    await client.end();

    const data = {
      totalPairs: parseInt(statsResult.rows[0].total_pairs),
      baseCurrencies: parseInt(statsResult.rows[0].base_currencies),
      quoteCurrencies: parseInt(statsResult.rows[0].quote_currencies),
      lastUpdate: statsResult.rows[0].last_update,
      topBaseCurrencies: topCurrenciesResult.rows.map(row => ({
        currency: row.base_asset,
        count: parseInt(row.pair_count)
      })),
      topQuoteCurrencies: quoteCurrenciesResult.rows.map(row => ({
        currency: row.quote_asset,
        count: parseInt(row.pair_count)
      }))
    };

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取币种更新信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取币种更新信息失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取币种更新历史
 */
router.get('/currency-update-history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const client = new Client(DB_CONFIG);
    await client.connect();

    // 获取更新历史（按更新时间排序）
    const historyResult = await client.query(`
      SELECT 
        DATE_TRUNC('hour', TO_TIMESTAMP(updated_at::bigint / 1000)) as update_hour,
        COUNT(*) as pairs_updated,
        COUNT(DISTINCT base_asset) as currencies_updated
      FROM spot_pairs
      WHERE updated_at IS NOT NULL
      GROUP BY update_hour
      ORDER BY update_hour DESC
      LIMIT $1
    `, [limit]);

    await client.end();

    const history = historyResult.rows.map(row => ({
      updateHour: row.update_hour,
      pairsUpdated: parseInt(row.pairs_updated),
      currenciesUpdated: parseInt(row.currencies_updated)
    }));

    res.json({
      success: true,
      data: {
        history,
        totalRecords: history.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取币种更新历史失败:', error);
    res.status(500).json({
      success: false,
      error: '获取币种更新历史失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;