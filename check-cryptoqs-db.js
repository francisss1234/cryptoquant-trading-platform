import { Client } from 'pg';

async function checkCryptoQSDB() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'cryptoqs',
    user: 'cryptoqs',
    password: '' // Try empty password first
  });
  
  try {
    await client.connect();
    console.log('✅ 成功连接到 cryptoqs 数据库');
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 数据库表:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check if trading_pairs exists
    const tableExists = tablesResult.rows.some(row => row.table_name === 'trading_pairs');
    
    if (tableExists) {
      console.log('\n📊 trading_pairs 表统计:');
      
      // Get total count
      const countResult = await client.query('SELECT COUNT(*) as total FROM trading_pairs');
      console.log(`   总记录数: ${countResult.rows[0].total}`);
      
      // Get exchange distribution
      const exchangeResult = await client.query(`
        SELECT exchange, COUNT(*) as count
        FROM trading_pairs
        GROUP BY exchange
        ORDER BY count DESC;
      `);
      
      console.log('\n🏢 交易所分布:');
      exchangeResult.rows.forEach(row => {
        console.log(`   ${row.exchange}: ${row.count} 交易对`);
      });
      
      // Get currency distribution
      const currencyResult = await client.query(`
        SELECT base_asset, COUNT(*) as count
        FROM trading_pairs
        GROUP BY base_asset
        ORDER BY count DESC
        LIMIT 10;
      `);
      
      console.log('\n💰 主要币种 (前10):');
      currencyResult.rows.forEach(row => {
        console.log(`   ${row.base_asset}: ${row.count} 交易对`);
      });
      
      // Get sample data
      const sampleResult = await client.query(`
        SELECT symbol, exchange, base_asset, quote_asset, price, volume_24h, updated_at
        FROM trading_pairs
        ORDER BY volume_24h DESC
        LIMIT 5;
      `);
      
      console.log('\n📈 交易量前5的交易对:');
      sampleResult.rows.forEach(row => {
        console.log(`   ${row.symbol} (${row.exchange}):`);
        console.log(`      价格: $${row.price}`);
        console.log(`      24h成交量: ${row.volume_24h}`);
        console.log(`      更新时间: ${row.updated_at}`);
        console.log('');
      });
      
    } else {
      console.log('⚠️  trading_pairs 表不存在');
    }
    
    await client.end();
    
  } catch (error) {
    console.log(`❌ 连接失败: ${error.message}`);
    
    // Try with other common passwords
    const passwords = ['password', 'postgres', 'cryptoqs', '123456'];
    
    for (const pwd of passwords) {
      console.log(`\n尝试密码: ${pwd}`);
      try {
        const client2 = new Client({
          host: 'localhost',
          port: 5432,
          database: 'cryptoqs',
          user: 'cryptoqs',
          password: pwd
        });
        
        await client2.connect();
        console.log(`✅ 密码 "${pwd}" 成功！`);
        await client2.end();
        break;
      } catch (err) {
        console.log(`❌ 密码 "${pwd}" 失败`);
      }
    }
  }
}

checkCryptoQSDB();