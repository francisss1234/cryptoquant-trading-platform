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
    
    console.log('\n📊 ====== CryptoQuant 交易所币种数据统计 ======');
    
    // Overall statistics from all pair tables
    const tables = [
      { name: '现货交易对', table: 'spot_pairs' },
      { name: '期货交易对', table: 'futures_pairs' },
      { name: '杠杆交易对', table: 'margin_pairs' }
    ];
    
    let totalPairs = 0;
    let allCurrencies = new Set();
    let allQuoteCurrencies = new Set();
    
    for (const { name, table } of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        totalPairs += count;
        
        console.log(`\n📈 ${name}:`);
        console.log(`   数量: ${count} 交易对`);
        
        if (count > 0) {
          // Get unique base currencies
          const baseResult = await client.query(`SELECT COUNT(DISTINCT base_asset) as count FROM ${table}`);
          const baseCount = parseInt(baseResult.rows[0].count);
          console.log(`   基础币种: ${baseCount} 种`);
          
          // Get unique quote currencies
          const quoteResult = await client.query(`SELECT COUNT(DISTINCT quote_asset) as count FROM ${table}`);
          const quoteCount = parseInt(quoteResult.rows[0].count);
          console.log(`   计价币种: ${quoteCount} 种`);
          
          // Get top base currencies
          const topBaseResult = await client.query(`
            SELECT base_asset, COUNT(*) as pair_count
            FROM ${table}
            GROUP BY base_asset
            ORDER BY pair_count DESC
            LIMIT 5;
          `);
          
          console.log(`   主要基础币种:`);
          topBaseResult.rows.forEach(row => {
            console.log(`     ${row.base_asset}: ${row.pair_count} 交易对`);
            allCurrencies.add(row.base_asset);
          });
          
          // Get top quote currencies
          const topQuoteResult = await client.query(`
            SELECT quote_asset, COUNT(*) as pair_count
            FROM ${table}
            GROUP BY quote_asset
            ORDER BY pair_count DESC
            LIMIT 3;
          `);
          
          console.log(`   主要计价币种:`);
          topQuoteResult.rows.forEach(row => {
            console.log(`     ${row.quote_asset}: ${row.pair_count} 交易对`);
            allQuoteCurrencies.add(row.quote_asset);
          });
          
          // Get sample trading pairs
          const sampleResult = await client.query(`
            SELECT symbol, base_asset, quote_asset, status, min_notional, updated_at
            FROM ${table}
            WHERE status = 'TRADING'
            ORDER BY symbol
            LIMIT 3;
          `);
          
          if (sampleResult.rows.length > 0) {
            console.log(`   示例交易对:`);
            sampleResult.rows.forEach(row => {
              console.log(`     ${row.symbol}: ${row.base_asset}/${row.quote_asset} (状态: ${row.status})`);
              console.log(`       最小名义价值: ${row.min_notional}`);
              console.log(`       更新时间: ${new Date(parseInt(row.updated_at)).toLocaleString()}`);
            });
          }
        }
        
      } catch (error) {
        console.log(`   ❌ 查询失败: ${error.message}`);
      }
    }
    
    console.log(`\n📊 总计统计:`);
    console.log(`   总交易对数: ${totalPairs}`);
    console.log(`   总基础币种: ${allCurrencies.size} 种`);
    console.log(`   总计价币种: ${allQuoteCurrencies.size} 种`);
    
    // Get currency distribution across all tables
    console.log(`\n💰 全平台币种分布:`);
    
    const allBaseResult = await client.query(`
      SELECT base_asset, SUM(pair_count) as total_pairs
      FROM (
        SELECT base_asset, COUNT(*) as pair_count FROM spot_pairs GROUP BY base_asset
        UNION ALL
        SELECT base_asset, COUNT(*) as pair_count FROM futures_pairs GROUP BY base_asset
        UNION ALL
        SELECT base_asset, COUNT(*) as pair_count FROM margin_pairs GROUP BY base_asset
      ) combined
      GROUP BY base_asset
      ORDER BY total_pairs DESC
      LIMIT 15;
    `);
    
    console.log(`   基础币种 (前15):`);
    allBaseResult.rows.forEach(row => {
      console.log(`     ${row.base_asset}: ${row.total_pairs} 交易对`);
    });
    
    const allQuoteResult = await client.query(`
      SELECT quote_asset, SUM(pair_count) as total_pairs
      FROM (
        SELECT quote_asset, COUNT(*) as pair_count FROM spot_pairs GROUP BY quote_asset
        UNION ALL
        SELECT quote_asset, COUNT(*) as pair_count FROM futures_pairs GROUP BY quote_asset
        UNION ALL
        SELECT quote_asset, COUNT(*) as pair_count FROM margin_pairs GROUP BY quote_asset
      ) combined
      GROUP BY quote_asset
      ORDER BY total_pairs DESC
      LIMIT 10;
    `);
    
    console.log(`   计价币种 (前10):`);
    allQuoteResult.rows.forEach(row => {
      console.log(`     ${row.quote_asset}: ${row.total_pairs} 交易对`);
    });
    
    // Show status distribution
    console.log(`\n📋 交易对状态分布:`);
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM (
        SELECT status FROM spot_pairs
        UNION ALL
        SELECT status FROM futures_pairs
        UNION ALL
        SELECT status FROM margin_pairs
      ) combined
      GROUP BY status
      ORDER BY count DESC;
    `);
    
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} 交易对`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    await client.end();
    
  } catch (error) {
    console.log(`❌ 数据库查询错误: ${error.message}`);
  }
}

displayExchangeCurrencies();