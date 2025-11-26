import { Pool } from 'pg';

// 数据库配置
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cryptoquant',
  user: 'postgres',
  password: 'password',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkDatabase() {
  console.log('🚀 开始检查数据库...\n');
  
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 检查交易对表
    const result = await client.query(`
      SELECT 
        exchange,
        COUNT(*) as pair_count,
        COUNT(DISTINCT base_asset) as base_coins,
        COUNT(DISTINCT quote_asset) as quote_coins,
        AVG(price) as avg_price,
        SUM(volume_24h) as total_volume,
        MAX(last_updated) as latest_update
      FROM trading_pairs
      GROUP BY exchange
      ORDER BY pair_count DESC;
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  交易对表中没有数据');
    } else {
      console.log('📊 === 交易所币种统计 ===\n');
      
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. 🏢 ${row.exchange.toUpperCase()}`);
        console.log(`   📈 交易对数量: ${row.pair_count}`);
        console.log(`   💰 基础币种: ${row.base_coins}`);
        console.log(`   💵 计价币种: ${row.quote_coins}`);
        console.log(`   💲 平均价格: $${parseFloat(row.avg_price || 0).toFixed(4)}`);
        console.log(`   📊 24h总成交量: $${parseFloat(row.total_volume || 0).toFixed(2)}`);
        console.log(`   🕐 最新更新: ${row.latest_update}`);
        console.log('');
      });
      
      // 获取热门交易对
      const hotPairs = await client.query(`
        SELECT symbol, exchange, price, volume_24h, change_percent_24h, last_updated
        FROM trading_pairs 
        WHERE volume_24h > 0 
        ORDER BY volume_24h DESC 
        LIMIT 10;
      `);
      
      console.log('🔥 === 热门交易对 TOP 10 ===\n');
      hotPairs.rows.forEach((row, index) => {
        const changeIcon = parseFloat(row.change_percent_24h || 0) >= 0 ? '📈' : '📉';
        console.log(`${index + 1}. ${row.symbol} (${row.exchange.toUpperCase()})`);
        console.log(`   💰 价格: $${parseFloat(row.price || 0).toFixed(4)}`);
        console.log(`   📊 24h成交量: $${parseFloat(row.volume_24h || 0).toFixed(2)}`);
        console.log(`   ${changeIcon} 24h涨跌: ${parseFloat(row.change_percent_24h || 0).toFixed(2)}%`);
        console.log(`   🕐 更新时间: ${row.last_updated}`);
        console.log('');
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    if (error.code === '28P01') {
      console.log('💡 提示: 请检查数据库密码是否正确');
      console.log('💡 提示: 可以尝试使用默认密码 "password" 或检查 .env 文件');
    } else if (error.code === '3D000') {
      console.log('💡 提示: 数据库 "cryptoquant" 不存在，需要初始化');
    }
  } finally {
    await pool.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

// 执行检查
console.log('🔍 CryptoQuant 数据库交易所币种检查');
console.log('=' .repeat(50));
checkDatabase().catch(console.error);