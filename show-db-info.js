import { Client } from 'pg';

// 数据库连接信息
console.log('🔐 CryptoQuant 数据库连接信息');
console.log('='.repeat(50));
console.log('主机: localhost');
console.log('端口: 5432');
console.log('用户: postgres');
console.log('密码: da111111');
console.log('主要数据库: cryptoqs');
console.log('');

// 快速连接测试
async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'da111111',
    database: 'cryptoqs'
  });
  
  try {
    await client.connect();
    console.log('✅ 数据库连接测试成功！');
    
    // 获取数据库统计
    const tables = ['spot_pairs', 'futures_pairs', 'margin_pairs', 'bars', 'sim_orders'];
    console.log('\n📊 数据库统计:');
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${result.rows[0].count} 条记录`);
      } catch (error) {
        console.log(`   ${table}: 查询失败`);
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.log('❌ 连接失败:', error.message);
  }
}

// 显示使用示例
console.log('💡 使用示例:');
console.log('');
console.log('Node.js 连接:');
console.log('  const { Client } = require("pg");');
console.log('  const client = new Client({');
console.log('    host: "localhost",');
console.log('    port: 5432,');
console.log('    user: "postgres",');
console.log('    password: "da111111",');
console.log('    database: "cryptoqs"');
console.log('  });');
console.log('  await client.connect();');
console.log('');
console.log('命令行连接:');
console.log('  psql -U postgres -h localhost -d cryptoqs');
console.log('');

// 执行连接测试
await testConnection();

console.log('\n📝 此信息已保存到 database-connection-config.md 文件中');