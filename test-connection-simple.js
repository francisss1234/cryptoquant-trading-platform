import { Client } from 'pg';

async function simpleTest() {
  console.log('🚀 测试数据库连接...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'da111111',
    database: 'cryptoqs'
  });
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功！');
    
    const result = await client.query('SELECT current_database(), current_user');
    console.log(`📊 当前数据库: ${result.rows[0].current_database}`);
    console.log(`👤 当前用户: ${result.rows[0].current_user}`);
    
    // 获取交易对统计
    const statsResult = await client.query(`
      SELECT 
        '现货' as type,
        COUNT(*) as count
      FROM spot_pairs
      UNION ALL
      SELECT 
        '期货' as type,
        COUNT(*) as count
      FROM futures_pairs
      UNION ALL
      SELECT 
        '杠杆' as type,
        COUNT(*) as count
      FROM margin_pairs;
    `);
    
    console.log('\n📈 交易对统计:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.count} 个交易对`);
    });
    
    await client.end();
    
  } catch (error) {
    console.log('❌ 连接失败:', error.message);
  }
}

simpleTest();