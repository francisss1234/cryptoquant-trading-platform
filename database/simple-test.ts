import { Pool } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cryptoquant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    console.log('🔄 正在测试PostgreSQL数据库连接...');
    console.log(`连接参数: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL数据库连接成功');
    console.log(`当前数据库时间: ${result.rows[0].current_time}`);
    
    // 测试表是否存在
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`找到 ${tablesResult.rows.length} 个表:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL数据库连接失败:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// 运行测试
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});