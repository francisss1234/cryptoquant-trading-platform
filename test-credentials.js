import { Client } from 'pg';

async function testConnection(config, name) {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log(`✅ ${name} 连接成功`);
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL版本: ${result.rows[0].version}`);
    
    // Check if trading_pairs table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trading_pairs'
      );
    `);
    
    if (tableResult.rows[0].exists) {
      console.log(`📋 trading_pairs表存在`);
      
      // Get table statistics
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total_pairs,
          COUNT(DISTINCT exchange) as exchange_count,
          COUNT(DISTINCT base_asset) as base_currencies,
          COUNT(DISTINCT quote_asset) as quote_currencies
        FROM trading_pairs;
      `);
      
      console.log(`📈 交易对统计:`);
      console.log(`   总交易对数: ${statsResult.rows[0].total_pairs}`);
      console.log(`   交易所数量: ${statsResult.rows[0].exchange_count}`);
      console.log(`   基础币种数: ${statsResult.rows[0].base_currencies}`);
      console.log(`   计价币种数: ${statsResult.rows[0].quote_currencies}`);
      
      // Get top exchanges
      const exchangeResult = await client.query(`
        SELECT exchange, COUNT(*) as pair_count
        FROM trading_pairs
        GROUP BY exchange
        ORDER BY pair_count DESC
        LIMIT 5;
      `);
      
      console.log(`🏢 主要交易所:`);
      exchangeResult.rows.forEach(row => {
        console.log(`   ${row.exchange}: ${row.pair_count} 交易对`);
      });
      
      // Get top currencies
      const currencyResult = await client.query(`
        SELECT base_asset, COUNT(*) as pair_count
        FROM trading_pairs
        GROUP BY base_asset
        ORDER BY pair_count DESC
        LIMIT 10;
      `);
      
      console.log(`💰 主要币种:`);
      currencyResult.rows.forEach(row => {
        console.log(`   ${row.base_asset}: ${row.pair_count} 交易对`);
      });
      
    } else {
      console.log(`⚠️  trading_pairs表不存在`);
    }
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`❌ ${name} 连接失败: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 测试数据库连接配置...\n');
  
  // Test configurations
  const configs = [
    {
      name: 'Docker配置',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'cryptoquant',
        user: 'cryptoquant_user',
        password: 'cryptoquant_password'
      }
    },
    {
      name: '.env配置',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'cryptoquant',
        user: 'postgres',
        password: 'password'
      }
    },
    {
      name: '默认PostgreSQL',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'password'
      }
    }
  ];
  
  let connected = false;
  
  for (const { name, config } of configs) {
    console.log(`测试 ${name}:`);
    const success = await testConnection(config, name);
    if (success) {
      connected = true;
      break;
    }
    console.log('');
  }
  
  if (!connected) {
    console.log('\n❌ 所有连接配置都失败');
    console.log('💡 建议:');
    console.log('   1. 检查PostgreSQL服务是否运行');
    console.log('   2. 检查用户名和密码是否正确');
    console.log('   3. 检查数据库是否存在');
    console.log('   4. 尝试使用psql命令行工具连接');
  }
}

main().catch(console.error);