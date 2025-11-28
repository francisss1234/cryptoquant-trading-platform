const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'da111111',
  database: 'cryptoqs'
});

async function checkTableStructure() {
  try {
    await client.connect();
    
    // 检查spot_pairs表结构
    const result = await client.query(`
      SELECT column_name, data_type, ordinal_position 
      FROM information_schema.columns 
      WHERE table_name = 'spot_pairs' 
      ORDER BY ordinal_position
    `);
    
    console.log('spot_pairs表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // 检查前几行数据作为示例
    const sampleData = await client.query('SELECT * FROM spot_pairs LIMIT 3');
    console.log('\n示例数据 (前两行):');
    sampleData.rows.slice(0, 2).forEach((row, index) => {
      console.log(`\n第${index + 1}行:`);
      Object.keys(row).forEach(key => {
        console.log(`  ${key}: ${row[key]}`);
      });
    });
    
    await client.end();
  } catch (err) {
    console.error('错误:', err.message);
  }
}

checkTableStructure();