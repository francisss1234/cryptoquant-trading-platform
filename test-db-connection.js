import { Pool } from 'pg';

// 数据库配置 - 尝试不同的密码配置
const configs = [
  {
    name: '默认配置 (.env)',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'cryptoquant',
      user: 'postgres',
      password: 'password',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  {
    name: 'Docker配置',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'cryptoquant',
      user: 'postgres',
      password: 'cryptoquant_password',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  {
    name: '无密码配置',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'cryptoquant',
      user: 'postgres',
      password: '',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  }
];

async function testConnection(config, name) {
  console.log(`\n🔄 测试连接: ${name}`);
  console.log(`📡 连接信息: ${config.user}@${config.host}:${config.port}/${config.database}`);
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    console.log('✅ 连接成功！');
    
    // 检查数据库版本
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL版本:', versionResult.rows[0].version.split(' ')[0]);
    
    // 检查数据库是否存在
    const dbResult = await client.query('SELECT current_database()');
    console.log('💾 当前数据库:', dbResult.rows[0].current_database);
    
    // 检查交易对表
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trading_pairs'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ 交易对表存在');
      
      // 获取交易对统计
      const stats = await client.query(`
        SELECT 
          COUNT(*) as total_pairs,
          COUNT(DISTINCT exchange) as exchanges,
          COUNT(DISTINCT base_asset) as base_coins,
          COUNT(DISTINCT quote_asset) as quote_coins,
          MAX(last_updated) as latest_update
        FROM trading_pairs;
      `);
      
      console.log('📈 统计信息:');
      console.log(`   总交易对: ${stats.rows[0].total_pairs}`);
      console.log(`   交易所数量: ${stats.rows[0].exchanges}`);
      console.log(`   基础币种: ${stats.rows[0].base_coins}`);
      console.log(`   计价币种: ${stats.rows[0].quote_coins}`);
      console.log(`   最新更新: ${stats.rows[0].latest_update}`);
      
      if (stats.rows[0].total_pairs > 0) {
        // 获取交易所详情
        const exchanges = await client.query(`
          SELECT 
            exchange,
            COUNT(*) as pair_count,
            COUNT(DISTINCT base_asset) as base_assets,
            AVG(price) as avg_price,
            SUM(volume_24h) as total_volume
          FROM trading_pairs
          GROUP BY exchange
          ORDER BY pair_count DESC;
        `);
        
        console.log('\n🏢 各交易所详情:');
        exchanges.rows.forEach(row => {
          console.log(`   ${row.exchange.toUpperCase()}:`);
          console.log(`     交易对: ${row.pair_count}`);
          console.log(`     基础币种: ${row.base_assets}`);
          console.log(`     平均价格: $${parseFloat(row.avg_price || 0).toFixed(2)}`);
          console.log(`     24h总成交量: $${(parseFloat(row.total_volume || 0) / 1000000).toFixed(2)}M`);
        });
        
        // 获取热门交易对
        const hotPairs = await client.query(`
          SELECT symbol, exchange, price, volume_24h, change_percent_24h
          FROM trading_pairs
          WHERE volume_24h > 0
          ORDER BY volume_24h DESC
          LIMIT 5;
        `);
        
        console.log('\n🔥 热门交易对 TOP 5:');
        hotPairs.rows.forEach((row, index) => {
          const changeIcon = parseFloat(row.change_percent_24h || 0) >= 0 ? '📈' : '📉';
          console.log(`   ${index + 1}. ${row.symbol} (${row.exchange.toUpperCase()})`);
          console.log(`      价格: $${parseFloat(row.price || 0).toFixed(4)}`);
          console.log(`      成交量: $${(parseFloat(row.volume_24h || 0) / 1000000).toFixed(2)}M`);
          console.log(`      涨跌: ${changeIcon} ${parseFloat(row.change_percent_24h || 0).toFixed(2)}%`);
        });
      }
      
    } else {
      console.log('⚠️  交易对表不存在，需要初始化数据库');
    }
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    await pool.end();
    return false;
  }
}

async function findWorkingConnection() {
  console.log('🔍 CryptoQuant 数据库连接测试工具');
  console.log('=' .repeat(60));
  
  for (const { name, config } of configs) {
    const success = await testConnection(config, name);
    if (success) {
      console.log(`\n✅ 使用成功的配置: ${name}`);
      return config;
    }
    console.log('');
  }
  
  console.log('\n❌ 所有连接尝试都失败了');
  console.log('💡 建议:');
  console.log('   1. 检查PostgreSQL服务是否正在运行');
  console.log('   2. 确认数据库用户名和密码');
  console.log('   3. 检查防火墙设置');
  console.log('   4. 尝试使用Docker启动PostgreSQL');
  console.log('   5. 检查数据库cryptoquant是否存在');
  
  return null;
}

// 执行连接测试
findWorkingConnection().catch(console.error);