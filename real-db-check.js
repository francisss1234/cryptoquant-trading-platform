import { Pool } from 'pg';

// 数据库配置 - 使用正确的Docker配置
const config = {
  host: 'localhost',
  port: 5432,
  database: 'cryptoquant',
  user: 'cryptoquant_user',  // Docker配置的用户名
  password: 'cryptoquant_password',  // Docker配置的密码
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

async function checkRealTradingPairs() {
  console.log('🔍 CryptoQuant 真实数据库交易所币种检查');
  console.log('=' .repeat(60));
  console.log(`📝 连接配置: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log('');
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 检查数据库版本
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL版本:', versionResult.rows[0].version.split(' ')[0]);
    
    // 获取当前数据库
    const dbResult = await client.query('SELECT current_database()');
    console.log('💾 当前数据库:', dbResult.rows[0].current_database);
    console.log('');
    
    // 检查交易对表是否存在
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trading_pairs'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️  交易对表 (trading_pairs) 不存在');
      console.log('💡 需要先运行数据采集服务或初始化数据库');
      client.release();
      await pool.end();
      return;
    }
    
    console.log('✅ 交易对表存在\n');
    
    // 获取总体统计
    const totalStats = await client.query(`
      SELECT 
        COUNT(*) as total_pairs,
        COUNT(DISTINCT exchange) as total_exchanges,
        COUNT(DISTINCT base_asset) as unique_base_assets,
        COUNT(DISTINCT quote_asset) as unique_quote_assets,
        MIN(last_updated) as oldest_update,
        MAX(last_updated) as latest_update,
        SUM(volume_24h) as total_volume_24h
      FROM trading_pairs;
    `);
    
    console.log('📊 === 交易对总体统计 ===');
    console.log(`总交易对数量: ${totalStats.rows[0].total_pairs}`);
    console.log(`交易所数量: ${totalStats.rows[0].total_exchanges}`);
    console.log(`基础币种数量: ${totalStats.rows[0].unique_base_assets}`);
    console.log(`计价币种数量: ${totalStats.rows[0].unique_quote_assets}`);
    console.log(`最旧更新时间: ${totalStats.rows[0].oldest_update}`);
    console.log(`最新更新时间: ${totalStats.rows[0].latest_update}`);
    console.log(`24h总成交量: $${(parseFloat(totalStats.rows[0].total_volume_24h || 0) / 1000000000).toFixed(2)}B`);
    console.log('');
    
    // 按交易所统计
    const exchangeStats = await client.query(`
      SELECT 
        exchange,
        COUNT(*) as pair_count,
        COUNT(DISTINCT base_asset) as base_assets,
        COUNT(DISTINCT quote_asset) as quote_assets,
        AVG(price) as avg_price,
        SUM(volume_24h) as total_volume_24h,
        MAX(last_updated) as latest_update
      FROM trading_pairs
      GROUP BY exchange
      ORDER BY pair_count DESC;
    `);
    
    console.log('🏢 === 各交易所统计 ===');
    exchangeStats.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.exchange.toUpperCase()}`);
      console.log(`   交易对数量: ${row.pair_count}`);
      console.log(`   基础币种: ${row.base_assets}`);
      console.log(`   计价币种: ${row.quote_assets}`);
      console.log(`   平均价格: $${parseFloat(row.avg_price).toFixed(2)}`);
      console.log(`   24h总成交量: $${(parseFloat(row.total_volume_24h || 0) / 1000000).toFixed(2)}M`);
      console.log(`   最新更新: ${row.latest_update}`);
      console.log('');
    });
    
    // 获取热门交易对（按成交量排序）
    const topVolumePairs = await client.query(`
      SELECT 
        symbol,
        exchange,
        base_asset,
        quote_asset,
        price,
        volume_24h,
        change_percent_24h,
        last_updated
      FROM trading_pairs
      WHERE volume_24h > 0
      ORDER BY volume_24h DESC
      LIMIT 15;
    `);
    
    console.log('🔥 === 热门交易对 (按24h成交量排序) ===');
    topVolumePairs.rows.forEach((row, index) => {
      const changeIcon = parseFloat(row.change_percent_24h || 0) >= 0 ? '📈' : '📉';
      const changeSign = parseFloat(row.change_percent_24h || 0) >= 0 ? '+' : '';
      console.log(`${index + 1}. ${row.symbol} (${row.exchange.toUpperCase()})`);
      console.log(`   基础币种: ${row.base_asset}`);
      console.log(`   计价币种: ${row.quote_asset}`);
      console.log(`   当前价格: $${parseFloat(row.price).toFixed(4)}`);
      console.log(`   24h成交量: $${(parseFloat(row.volume_24h || 0) / 1000000).toFixed(2)}M`);
      console.log(`   24h涨跌幅: ${changeIcon} ${changeSign}${parseFloat(row.change_percent_24h || 0).toFixed(2)}%`);
      console.log(`   更新时间: ${row.last_updated}`);
      console.log('');
    });
    
    // 获取价格变化最大的交易对
    const topChangePairs = await client.query(`
      SELECT 
        symbol,
        exchange,
        base_asset,
        quote_asset,
        price,
        change_percent_24h,
        volume_24h,
        last_updated
      FROM trading_pairs
      WHERE change_percent_24h IS NOT NULL 
        AND ABS(change_percent_24h) > 0
      ORDER BY ABS(change_percent_24h) DESC
      LIMIT 10;
    `);
    
    console.log('📈 === 价格波动最大交易对 (24h涨跌幅) ===');
    topChangePairs.rows.forEach((row, index) => {
      const changeIcon = parseFloat(row.change_percent_24h || 0) > 0 ? '📈' : '📉';
      const changeSign = parseFloat(row.change_percent_24h || 0) > 0 ? '+' : '';
      console.log(`${index + 1}. ${changeIcon} ${row.symbol} (${row.exchange.toUpperCase()})`);
      console.log(`   当前价格: $${parseFloat(row.price).toFixed(4)}`);
      console.log(`   24h涨跌幅: ${changeSign}${parseFloat(row.change_percent_24h).toFixed(2)}%`);
      console.log(`   24h成交量: $${(parseFloat(row.volume_24h || 0) / 1000000).toFixed(2)}M`);
      console.log(`   更新时间: ${row.last_updated}`);
      console.log('');
    });
    
    // 获取最新添加的交易对
    const recentPairs = await client.query(`
      SELECT 
        symbol,
        exchange,
        base_asset,
        quote_asset,
        price,
        created_at
      FROM trading_pairs
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log('🆕 === 最新添加的交易对 ===');
    recentPairs.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} (${row.exchange.toUpperCase()})`);
      console.log(`   基础币种: ${row.base_asset}`);
      console.log(`   计价币种: ${row.quote_asset}`);
      console.log(`   当前价格: $${parseFloat(row.price).toFixed(4)}`);
      console.log(`   添加时间: ${row.created_at}`);
      console.log('');
    });
    
    client.release();
    await pool.end();
    
    console.log('✅ 数据库查询完成！');
    
  } catch (error) {
    console.error('❌ 数据库查询错误:', error.message);
    if (error.code === '28P01') {
      console.log('💡 提示: 用户名或密码错误');
      console.log('💡 请检查Docker Compose配置或数据库用户权限');
    } else if (error.code === '3D000') {
      console.log('💡 提示: 数据库不存在，需要初始化');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 数据库连接被拒绝，请检查服务是否运行');
    }
  } finally {
    await pool.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

// 执行检查
console.log('🔍 CryptoQuant 真实数据库交易所币种检查');
console.log('=' .repeat(60));
checkRealTradingPairs().catch(console.error);