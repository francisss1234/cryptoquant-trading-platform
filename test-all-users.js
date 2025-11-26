import { Client } from 'pg';

async function testAllUsers() {
  const users = ['postgres', 'cryptoqs', 'cryptoquant_user'];
  const databases = ['postgres', 'cryptoqs', 'cryptoquant'];
  
  console.log('测试密码 da111111 对所有用户和数据库组合:\n');
  
  for (const user of users) {
    for (const database of databases) {
      const config = {
        host: 'localhost',
        port: 5432,
        database: database,
        user: user,
        password: 'da111111'
      };
      
      const client = new Client(config);
      
      try {
        await client.connect();
        console.log(`✅ 用户 ${user} -> 数据库 ${database}: 连接成功！`);
        
        // Get table count
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        console.log(`   表数量: ${result.rows[0].count}`);
        
        await client.end();
        
      } catch (error) {
        if (error.message.includes('密码')) {
          console.log(`❌ 用户 ${user} -> 数据库 ${database}: 密码错误`);
        } else if (error.message.includes('数据库')) {
          console.log(`❌ 用户 ${user} -> 数据库 ${database}: 数据库不存在`);
        } else {
          console.log(`❌ 用户 ${user} -> 数据库 ${database}: ${error.message}`);
        }
      }
    }
    console.log('');
  }
}

testAllUsers();