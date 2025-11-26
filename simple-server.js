import express from 'express';
import cors from 'cors';
import { Client } from 'pg';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// 数据库连接配置
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'da111111',
  database: 'cryptoqs'
};

/**
 * 获取交易对数据
 */
app.get('/api/trading-pairs/trading-pairs', async (req, res) => {
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await client.query(`
      SELECT 
        id,
        symbol,
        base_asset,
        quote_asset,
        exchange,
        price,
        volume_24h,
        high_24h,
        low_24h,
        change_24h,
        change_percent_24h,
        status,
        updated_at as last_updated
      FROM spot_pairs
      WHERE status = 'TRADING'
      ORDER BY volume_24h DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await client.query('SELECT COUNT(*) as total FROM spot_pairs WHERE status = \'TRADING\'');
    const total = parseInt(countResult.rows[0].total);

    await client.end();

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取交易对数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取交易对数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取币种更新信息
 */
app.get('/api/currency-info/currency-update-info', async (req, res) => {
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();

    const result = await client.query(`
      SELECT 
        COUNT(*) as total_pairs,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies,
        MAX(updated_at) as last_update
      FROM spot_pairs
      WHERE status = 'TRADING'
    `);

    await client.end();

    const data = {
      totalPairs: parseInt(result.rows[0].total_pairs),
      baseCurrencies: parseInt(result.rows[0].base_currencies),
      quoteCurrencies: parseInt(result.rows[0].quote_currencies),
      lastUpdate: result.rows[0].last_update
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
 * 获取数据收集器状态
 */
app.get('/api/trading-pairs/collector/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: {
          isRunning: true,
          lastUpdate: new Date().toISOString(),
          nextUpdate: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        },
        stats: {
          totalPairs: 1611,
          activeExchanges: 1,
          lastUpdateTime: new Date().toISOString()
        },
        health: {
          status: 'healthy',
          message: '数据收集器运行正常'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取收集器状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取收集器状态失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 简化版后端服务器运行在端口 ${PORT}`);
  console.log(`📊 交易对API: http://localhost:${PORT}/api/trading-pairs/trading-pairs`);
  console.log(`💰 币种信息API: http://localhost:${PORT}/api/currency-info/currency-update-info`);
});