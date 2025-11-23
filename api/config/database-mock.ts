import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 简化的SQLite替代方案，用于开发和测试
// 在生产环境中应该使用PostgreSQL

interface MockRow {
  [key: string]: any;
}

interface MockResult {
  rows: MockRow[];
  rowCount: number;
}

class MockPool {
  private data: Map<string, MockRow[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    if (this.initialized) return;
    
    // 模拟市场数据
    this.data.set('market_data', [
      {
        id: 1,
        exchange: 'binance',
        symbol: 'BTC/USDT',
        timeframe: '1h',
        timestamp: Date.now() - 3600000,
        open: 45000.00,
        high: 45500.00,
        low: 44800.00,
        close: 45200.00,
        volume: 1250.50,
        quote_volume: 56500000.00,
        trades_count: 15000
      },
      {
        id: 2,
        exchange: 'binance',
        symbol: 'BTC/USDT',
        timeframe: '1h',
        timestamp: Date.now() - 7200000,
        open: 44800.00,
        high: 45100.00,
        low: 44600.00,
        close: 45000.00,
        volume: 1100.25,
        quote_volume: 49500000.00,
        trades_count: 12000
      }
    ]);

    // 模拟用户数据
    this.data.set('users', [
      {
        id: 1,
        email: 'admin@cryptoquant.com',
        password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    this.initialized = true;
  }

  async query(sql: string, params?: any[]): Promise<MockResult> {
    console.log('📊 执行查询:', sql, params);
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));

    // 简单的SQL解析和模拟
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.includes('select')) {
      return this.handleSelect(sql, params);
    } else if (sqlLower.includes('insert')) {
      return this.handleInsert(sql, params);
    } else if (sqlLower.includes('update')) {
      return this.handleUpdate(sql, params);
    } else if (sqlLower.includes('delete')) {
      return this.handleDelete(sql, params);
    } else if (sqlLower.includes('create table')) {
      return this.handleCreateTable(sql);
    }

    return { rows: [], rowCount: 0 };
  }

  private handleSelect(sql: string, params?: any[]): MockResult {
    // 简单的表名提取
    const tableMatch = sql.match(/from\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    
    const tableName = tableMatch[1];
    const tableData = this.data.get(tableName) || [];
    
    // 简单的WHERE条件处理
    if (sql.includes('WHERE') && params) {
      const whereClause = sql.split('WHERE')[1].split('ORDER BY')[0].trim();
      
      if (whereClause.includes('exchange = $1 AND symbol = $2 AND timeframe = $3')) {
        const filteredData = tableData.filter(row => 
          row.exchange === params[0] &&
          row.symbol === params[1] &&
          row.timeframe === params[2]
        );
        return { rows: filteredData, rowCount: filteredData.length };
      }
      
      if (whereClause.includes('exchange = $1 AND symbol = $2')) {
        const filteredData = tableData.filter(row => 
          row.exchange === params[0] &&
          row.symbol === params[1]
        );
        return { rows: filteredData, rowCount: filteredData.length };
      }
    }

    return { rows: tableData, rowCount: tableData.length };
  }

  private handleInsert(sql: string, params?: any[]): MockResult {
    // 简化的插入处理
    return { rows: [{ id: Date.now() }], rowCount: 1 };
  }

  private handleUpdate(sql: string, params?: any[]): MockResult {
    // 简化的更新处理
    return { rows: [], rowCount: 1 };
  }

  private handleDelete(sql: string, params?: any[]): MockResult {
    // 简化的删除处理
    return { rows: [], rowCount: 0 };
  }

  private handleCreateTable(sql: string): MockResult {
    console.log('📝 创建表:', sql);
    return { rows: [], rowCount: 0 };
  }

  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }
}

export const pool = new MockPool() as any;

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ 数据库连接成功 (使用模拟数据)');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

export async function initDatabase(): Promise<void> {
  try {
    console.log('✅ 数据库初始化完成 (模拟模式)');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

export default pool;