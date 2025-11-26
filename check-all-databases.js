import { Client } from 'pg';

async function checkAllDatabases() {
  const databases = [
    { name: 'cryptoqs', user: 'cryptoqs', password: 'cryptoqs' },
    { name: 'cryptoquant', user: 'cryptoquant_user', password: 'cryptoquant_password' },
    { name: 'postgres', user: 'postgres', password: 'password' }
  ];
  
  for (const db of databases) {
    console.log(`\n🔍 检查数据库: ${db.name}`);
    console.log('='.repeat(50));
    
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: db.name,
      user: db.user,
      password: db.password
    });
    
    try {
      await client.connect();
      console.log(`✅ 成功连接到 ${db.name} 数据库`);
      
      // List all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log(`📋 数据库表:`);
        tablesResult.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
        
        // Check each table for data
        for (const table of tablesResult.rows) {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
          console.log(`   ${table.table_name}: ${countResult.rows[0].count} 条记录`);
        }
        
        // Check specifically for trading-related tables
        const tradingTables = tablesResult.rows.filter(table => 
          table.table_name.includes('trading') || 
          table.table_name.includes('pair') || 
          table.table_name.includes('exchange') ||
          table.table_name.includes('currency')
        );
        
        if (tradingTables.length > 0) {
          console.log(`\n💹 交易相关表:`);
          for (const table of tradingTables) {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            console.log(`   ${table.table_name}: ${countResult.rows[0].count} 条记录`);
            
            // Show sample data if exists
            if (countResult.rows[0].count > 0) {
              const sampleResult = await client.query(`SELECT * FROM ${table.table_name} LIMIT 3`);
              console.log(`   示例数据:`);
              sampleResult.rows.forEach((row, index) => {
                console.log(`     ${index + 1}. ${JSON.stringify(row)}`);
              });
            }
          }
        }
        
      } else {
        console.log('⚠️  没有找到任何表');
      }
      
      await client.end();
      
    } catch (error) {
      console.log(`❌ 连接失败: ${error.message}`);
    }
    
    console.log('');
  }
}

checkAllDatabases();