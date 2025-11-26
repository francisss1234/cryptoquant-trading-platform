#!/usr/bin/env node

import { Client } from 'pg';

// 快速数据库连接配置
const QUICK_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'da111111',
  database: 'cryptoqs'
};

/**
 * 快速获取数据库连接
 * @returns {Promise<Client>} PostgreSQL 客户端连接
 */
export async function quickConnect() {
  const client = new Client(QUICK_CONFIG);
  await client.connect();
  return client;
}

/**
 * 快速执行SQL查询
 * @param {string} sql - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 */
export async function quickQuery(sql, params = []) {
  const client = await quickConnect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    await client.end();
  }
}

/**
 * 显示数据库概览
 */
export async function showOverview() {
  console.log('📊 CryptoQuant 数据库概览\n');
  
  const tables = [
    { name: '现货交易对', table: 'spot_pairs' },
    { name: '期货交易对', table: 'futures_pairs' },
    { name: '杠杆交易对', table: 'margin_pairs' },
    { name: 'K线数据', table: 'bars' },
    { name: '模拟订单', table: 'sim_orders' }
  ];
  
  for (const { name, table } of tables) {
    try {
      const result = await quickQuery(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ ${name}: ${result.rows[0].count} 条记录`);
    } catch (error) {
      console.log(`❌ ${name}: 查询失败`);
    }
  }
  
  console.log('\n💡 使用说明:');
  console.log('  import { quickConnect, quickQuery } from "./quick-db.js"');
  console.log('  const client = await quickConnect();');
  console.log('  const result = await quickQuery("SELECT * FROM spot_pairs LIMIT 5");');
}

// 如果直接运行此文件
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  showOverview().catch(console.error);
}