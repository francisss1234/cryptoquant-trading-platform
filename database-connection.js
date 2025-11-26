import { Client } from 'pg';

// 数据库连接配置
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'da111111',
  database: 'cryptoqs'
};

// 快速连接函数
export async function getDatabaseConnection() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  return client;
}

// 测试连接
export async function testConnection() {
  try {
    const client = await getDatabaseConnection();
    console.log('✅ 数据库连接成功');
    
    const result = await client.query('SELECT current_database(), current_user, now()');
    console.log(`📊 当前数据库: ${result.rows[0].current_database}`);
    console.log(`👤 当前用户: ${result.rows[0].current_user}`);
    console.log(`⏰ 当前时间: ${result.rows[0].now}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 获取交易对统计
export async function getTradingPairsStats() {
  const client = await getDatabaseConnection();
  
  try {
    const result = await client.query(`
      SELECT 
        'spot_pairs' as table_name,
        COUNT(*) as total_pairs,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies
      FROM spot_pairs
      UNION ALL
      SELECT 
        'futures_pairs' as table_name,
        COUNT(*) as total_pairs,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies
      FROM futures_pairs
      UNION ALL
      SELECT 
        'margin_pairs' as table_name,
        COUNT(*) as total_pairs,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies
      FROM margin_pairs;
    `);
    
    return result.rows;
  } finally {
    await client.end();
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 CryptoQuant 数据库连接测试\n');
  
  const connected = await testConnection();
  if (connected) {
    console.log('\n📈 获取交易对统计...');
    const stats = await getTradingPairsStats();
    console.table(stats);
  }
}