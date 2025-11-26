import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

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

// 币种更新信息API
app.get('/api/currency-info/currency-update-info', async (req, res) => {
  try {
    const { Client } = await import('pg');
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

    await client.end();

    const data = {
      totalPairs: parseInt(statsResult.rows[0].total_pairs),
      baseCurrencies: parseInt(statsResult.rows[0].base_currencies),
      quoteCurrencies: parseInt(statsResult.rows[0].quote_currencies),
      lastUpdate: statsResult.rows[0].last_update
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

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在端口 ${PORT}`);
  console.log(`📊 币种更新信息API: http://localhost:${PORT}/api/currency-info/currency-update-info`);
});