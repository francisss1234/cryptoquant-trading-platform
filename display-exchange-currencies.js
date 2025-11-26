import { Client } from 'pg';

async function displayExchangeCurrencies() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'cryptoqs',
    user: 'cryptoqs',
    password: 'cryptoqs'
  });
  
  try {
    await client.connect();
    console.log('✅ 成功连接到 cryptoqs 数据库');
    
    // Check if trading_pairs table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trading_pairs'
      );
    `);
    
    if (!tableResult.rows[0].exists) {
      console.log('⚠️  trading_pairs 表不存在');
      await client.end();
      return;
    }
    
    console.log('\n📊 ====== CryptoQuant 交易所币种数据统计 ======');
    
    // Overall statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_pairs,
        COUNT(DISTINCT exchange) as exchange_count,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies,
        MIN(created_at) as first_record,
        MAX(updated_at) as last_update
      FROM trading_pairs;
    `);
    
    console.log(`\n📈 总体统计:`);
    console.log(`   总交易对数: ${statsResult.rows[0].total_pairs}`);
    console.log(`   交易所数量: ${statsResult.rows[0].exchange_count}`);
    console.log(`   基础币种数: ${statsResult.rows[0].base_currencies}`);
    console.log(`   计价币种数: ${statsResult.rows[0].quote_currencies}`);
    console.log(`   首条记录: ${statsResult.rows[0].first_record}`);
    console.log(`   最近更新: ${statsResult.rows[0].last_update}`);
    
    // Exchange distribution
    const exchangeResult = await client.query(`
      SELECT exchange, COUNT(*) as pair_count
      FROM trading_pairs
      GROUP BY exchange
      ORDER BY pair_count DESC;
    `);
    
    console.log(`\n🏢 交易所分布:`);
    exchangeResult.rows.forEach(row => {
      console.log(`   ${row.exchange}: ${row.pair_count} 交易对`);
    });
    
    // Top base currencies
    const baseCurrencyResult = await client.query(`
      SELECT base_asset, COUNT(*) as pair_count
      FROM trading_pairs
      GROUP BY base_asset
      ORDER BY pair_count DESC
      LIMIT 15;
    `);
    
    console.log(`\n💰 主要基础币种 (前15):`);
    baseCurrencyResult.rows.forEach(row => {
      console.log(`   ${row.base_asset}: ${row.pair_count} 交易对`);
    });
    
    // Top quote currencies
    const quoteCurrencyResult = await client.query(`
      SELECT quote_asset, COUNT(*) as pair_count
      FROM trading_pairs
      GROUP BY quote_asset
      ORDER BY pair_count DESC
      LIMIT 10;
    `);
    
    console.log(`\n💵 主要计价币种 (前10):`);
    quoteCurrencyResult.rows.forEach(row => {
      console.log(`   ${row.quote_asset}: ${row.pair_count} 交易对`);
    });
    
    // Top trading pairs by volume
    const volumeResult = await client.query(`
      SELECT symbol, exchange, base_asset, quote_asset, price, volume_24h, change_24h, updated_at
      FROM trading_pairs
      WHERE volume_24h > 0
      ORDER BY volume_24h DESC
      LIMIT 10;
    `);
    
    console.log(`\n📈 24小时交易量前10的交易对:`);
    volumeResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} (${row.exchange})`);
      console.log(`      价格: $${parseFloat(row.price).toFixed(4)}`);
      console.log(`      24h成交量: ${parseFloat(row.volume_24h).toFixed(2)}`);
      console.log(`      24h涨跌: ${parseFloat(row.change_24h).toFixed(4)} (${parseFloat(row.change_24h) >= 0 ? '+' : ''}${((parseFloat(row.change_24h) / parseFloat(row.price)) * 100).toFixed(2)}%)`);
      console.log(`      更新时间: ${row.updated_at}`);
      console.log('');
    });
    
    // Recent updates
    const recentResult = await client.query(`
      SELECT symbol, exchange, price, volume_24h, updated_at
      FROM trading_pairs
      ORDER BY updated_at DESC
      LIMIT 5;
    `);
    
    console.log(`\n🔄 最近更新的交易对:`);
    recentResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} (${row.exchange}) - ${row.updated_at}`);
    });
    
    // Currency pairs combinations
    const pairResult = await client.query(`
      SELECT 
        base_asset || '/' || quote_asset as pair,
        COUNT(*) as exchange_count,
        STRING_AGG(exchange, ', ' ORDER BY exchange) as exchanges
      FROM trading_pairs
      GROUP BY base_asset, quote_asset
      HAVING COUNT(*) > 1
      ORDER BY exchange_count DESC
      LIMIT 10;
    `);
    
    console.log(`\n🔗 跨交易所交易对 (前10):`);
    pairResult.rows.forEach(row => {
      console.log(`   ${row.pair}: ${row.exchange_count} 交易所 (${row.exchanges})`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    await client.end();
    
  } catch (error) {
    console.log(`❌ 数据库查询错误: ${error.message}`);
  }
}

displayExchangeCurrencies();