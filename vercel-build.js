#!/usr/bin/env node

// 简化的Vercel构建脚本，只构建前端部分
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 开始构建前端应用...');

try {
  // 直接运行Vite构建，跳过TypeScript检查
  console.log('📦 运行Vite构建...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('✅ 构建成功完成！');
  
  // 创建简单的API路由文件
  const apiContent = `
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'da111111',
  database: process.env.DB_NAME || 'cryptoqs'
};

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 交易对API端点
app.get('/api/trading-pairs/trading-pairs', async (req, res) => {
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await client.query(\`
      SELECT 
        symbol,
        base_asset as baseCurrency,
        quote_asset as quoteCurrency,
        status,
        min_notional as minNotional,
        updated_at as lastUpdated
      FROM spot_pairs
      WHERE status = 'TRADING'
      ORDER BY symbol ASC
      LIMIT \$1 OFFSET \$2
    \`, [limit, offset]);

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

// 币种信息API端点
app.get('/api/currency-info/currency-update-info', async (req, res) => {
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();

    const totalPairsResult = await client.query('SELECT COUNT(*) as total FROM spot_pairs WHERE status = \'TRADING\'');
    const totalPairs = parseInt(totalPairsResult.rows[0].total);

    const baseCurrenciesResult = await client.query('SELECT COUNT(DISTINCT base_asset) as total FROM spot_pairs WHERE status = \'TRADING\'');
    const baseCurrencies = parseInt(baseCurrenciesResult.rows[0].total);

    const quoteCurrenciesResult = await client.query('SELECT COUNT(DISTINCT quote_asset) as total FROM spot_pairs WHERE status = \'TRADING\'');
    const quoteCurrencies = parseInt(quoteCurrenciesResult.rows[0].total);

    const lastUpdateResult = await client.query('SELECT MAX(updated_at) as lastUpdate FROM spot_pairs WHERE status = \'TRADING\'');
    const lastUpdate = lastUpdateResult.rows[0].lastupdate;

    await client.end();

    res.json({
      success: true,
      data: {
        totalPairs,
        baseCurrencies,
        quoteCurrencies,
        lastUpdate: lastUpdate || Date.now()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取币种信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取币种信息失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 API服务器运行在端口 \${PORT}\`);
});

module.exports = app;
  `;
  
  fs.writeFileSync('api-server.js', apiContent.trim());
  console.log('✅ API服务器文件创建完成');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}