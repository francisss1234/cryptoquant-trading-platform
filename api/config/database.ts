import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseConnection {
  private mockDb: MockDatabase;

  constructor() {
    this.mockDb = new MockDatabase();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.mockDb.query(sql, params);
  }
}

// 简化的内存数据库，用于开发和测试
class MockDatabase {
  private data: Map<string, any[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (this.initialized) return;
    
    // 初始化一些示例数据
    this.data.set('market_data', []);
    this.data.set('users', []);
    this.data.set('strategies', []);
    this.data.set('trading_signals', []);
    this.data.set('orders', []);
    this.data.set('trades', []);
    this.data.set('backtest_results', []);
    
    this.initialized = true;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    console.log('📊 MockDB执行查询:', sql, params);
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 50));

    // 简化SQL处理
    const sqlLower = sql.toLowerCase().trim();
    
    // SELECT查询
    if (sqlLower.includes('select')) {
      return this.handleSelect(sql, params);
    }
    
    // INSERT查询
    if (sqlLower.includes('insert')) {
      return this.handleInsert(sql, params);
    }
    
    // UPDATE查询
    if (sqlLower.includes('update')) {
      return this.handleUpdate(sql, params);
    }
    
    // CREATE TABLE
    if (sqlLower.includes('create table')) {
      console.log('📝 创建表结构');
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }

  private handleSelect(sql: string, params?: any[]): any {
    // 简单的表名提取
    const tableMatch = sql.match(/from\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    
    const tableName = tableMatch[1];
    let tableData = this.data.get(tableName) || [];
    
    // 简单的WHERE条件处理
    if (sql.includes('WHERE') && params && params.length > 0) {
      // 处理 exchange = $1 AND symbol = $2 AND timeframe = $3
      if (sql.includes('exchange = $1 AND symbol = $2 AND timeframe = $3')) {
        tableData = tableData.filter(row => 
          row.exchange === params[0] &&
          row.symbol === params[1] &&
          row.timeframe === params[2]
        );
      }
      // 处理 exchange = $1 AND symbol = $2
      else if (sql.includes('exchange = $1 AND symbol = $2')) {
        tableData = tableData.filter(row => 
          row.exchange === params[0] &&
          row.symbol === params[1]
        );
      }
      // 处理其他简单条件
      else {
        console.log('⚠️ 未处理的WHERE条件，返回全部数据');
      }
    }

    // 处理ORDER BY
    if (sql.includes('ORDER BY')) {
      const orderMatch = sql.match(/order by\s+(\w+)\s*(desc|asc)?/i);
      if (orderMatch) {
        const field = orderMatch[1];
        const direction = orderMatch[2]?.toLowerCase() || 'asc';
        
        tableData = [...tableData].sort((a, b) => {
          if (direction === 'desc') {
            return b[field] - a[field];
          }
          return a[field] - b[field];
        });
      }
    }

    // 处理LIMIT
    if (sql.includes('LIMIT')) {
      const limitMatch = sql.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        tableData = tableData.slice(0, limit);
      }
    }

    return { rows: tableData, rowCount: tableData.length };
  }

  private handleInsert(sql: string, params?: any[]): any {
    console.log('📝 处理INSERT操作');
    return { rows: [{ id: Date.now() }], rowCount: 1 };
  }

  private handleUpdate(sql: string, params?: any[]): any {
    console.log('🔄 处理UPDATE操作');
    return { rows: [], rowCount: 1 };
  }

  async connect(): Promise<any> {
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }
}

// 创建单例实例
const mockDb = new MockDatabase();

export const pool = {
  query: (sql: string, params?: any[]) => mockDb.query(sql, params)
} as any;

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ 数据库连接成功 (开发模式 - 使用内存数据库)');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

export async function initDatabase(): Promise<void> {
  try {
    console.log('✅ 数据库初始化完成 (开发模式)');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

export default pool;