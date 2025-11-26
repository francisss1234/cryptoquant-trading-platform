import { Client } from 'pg';

async function testPassword() {
  const configs = [
    {
      name: 'cryptoqs数据库',
      host: 'localhost',
      port: 5432,
      database: 'cryptoqs',
      user: 'cryptoqs',
      password: 'da111111'
    },
    {
      name: 'postgres数据库',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'da111111'
    }
  ];
  
  for (const config of configs) {
    console.log(`测试 ${config.name} 密码 da111111:`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`✅ ${config.name} 连接成功！`);
      
      // Test query
      const result = await client.query('SELECT version()');
      console.log(`📊 PostgreSQL版本: ${result.rows[0].version}`);
      
      // List databases
      const dbResult = await client.query('SELECT datname FROM pg_database ORDER BY datname');
      console.log(`💾 可用数据库: ${dbResult.rows.map(row => row.datname).join(', ')}`);
      
      await client.end();
      
    } catch (error) {
      console.log(`❌ 连接失败: ${error.message}`);
    }
    
    console.log('');
  }
}

testPassword();