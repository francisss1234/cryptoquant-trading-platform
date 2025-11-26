import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cryptoquant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// 创建连接池
const pool = new Pool(dbConfig);

/**
 * 测试数据库连接
 */
async function testConnection(): Promise<boolean> {
  try {
    console.log('🔄 正在测试PostgreSQL数据库连接...');
    console.log(`📡 连接配置: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    const client = await pool.connect();
    
    // 测试基本连接
    await client.query('SELECT 1');
    console.log('✅ 基本连接测试通过');
    
    // 获取数据库版本
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL版本:', versionResult.rows[0].version);
    
    // 获取当前数据库
    const dbResult = await client.query('SELECT current_database()');
    console.log('💾 当前数据库:', dbResult.rows[0].current_database);
    
    // 获取表列表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 数据库表:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  数据库中暂无表结构');
    }
    
    // 获取索引信息
    const indexesResult = await client.query(`
      SELECT schemaname, tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    if (indexesResult.rows.length > 0) {
      console.log('🔍 数据库索引:');
      indexesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}.${row.indexname}`);
      });
    }
    
    client.release();
    
    console.log('✅ 数据库连接测试完成！');
    return true;
    
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error);
    return false;
  }
}

/**
 * 初始化数据库表结构
 */
async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔄 正在初始化数据库表结构...');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'database', 'init-postgresql.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句（简单处理）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const statement of statements) {
        if (statement.toLowerCase().includes('create database')) {
          // 创建数据库需要特殊处理，通常在连接前执行
          console.log('⚠️  跳过数据库创建语句，请手动创建数据库');
          continue;
        }
        
        if (statement.toLowerCase().includes('\\c ')) {
          // 跳过连接数据库命令
          continue;
        }
        
        if (statement.toLowerCase().includes('insert into')) {
          console.log('📝 插入示例数据...');
        }
        
        await client.query(statement);
      }
      
      await client.query('COMMIT');
      console.log('✅ 数据库表结构初始化完成！');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 验证数据完整性
 */
async function validateData(): Promise<void> {
  try {
    console.log('🔍 正在验证数据完整性...');
    
    const validations = [
      {
        name: '用户表',
        query: 'SELECT COUNT(*) as count FROM users',
        expected: 3
      },
      {
        name: '交易所表',
        query: 'SELECT COUNT(*) as count FROM exchanges',
        expected: 3
      },
      {
        name: '策略表',
        query: 'SELECT COUNT(*) as count FROM strategies',
        expected: 3
      },
      {
        name: '交易信号表',
        query: 'SELECT COUNT(*) as count FROM trading_signals',
        expected: 4
      },
      {
        name: '订单表',
        query: 'SELECT COUNT(*) as count FROM orders',
        expected: 4
      },
      {
        name: '交易记录表',
        query: 'SELECT COUNT(*) as count FROM trades',
        expected: 3
      }
    ];
    
    for (const validation of validations) {
      try {
        const result = await pool.query(validation.query);
        const count = parseInt(result.rows[0].count);
        
        if (count >= validation.expected) {
          console.log(`✅ ${validation.name}: ${count} 条记录`);
        } else {
          console.log(`⚠️  ${validation.name}: ${count} 条记录 (预期至少 ${validation.expected})`);
        }
      } catch (error) {
        console.log(`❌ ${validation.name}: 表不存在或查询失败`);
      }
    }
    
    console.log('✅ 数据验证完成！');
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error);
    throw error;
  }
}

/**
 * 执行数据库清理
 */
async function cleanup(): Promise<void> {
  try {
    console.log('🧹 正在清理数据库连接...');
    await pool.end();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🚀 CryptoQuant 数据库配置测试工具');
  console.log('=====================================');
  
  try {
    // 测试连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('❌ 无法连接到数据库，请检查配置');
      process.exit(1);
    }
    
    // 询问是否初始化数据库
    console.log('\n🤔 是否初始化数据库表结构？(y/N)');
    
    // 模拟用户输入（在实际环境中可以使用readline）
    const shouldInitialize = process.argv.includes('--init');
    
    if (shouldInitialize) {
      await initializeDatabase();
      await validateData();
    } else {
      console.log('ℹ️  跳过数据库初始化，使用现有表结构');
    }
    
    console.log('\n✅ 数据库配置测试完成！');
    
  } catch (error) {
    console.error('❌ 数据库配置失败:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testConnection, initializeDatabase, validateData, pool };