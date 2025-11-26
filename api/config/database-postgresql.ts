import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cryptoquant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(dbConfig);

export class DatabaseConnection {
  private pool: Pool;

  constructor() {
    this.pool = pool;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pool.on('error', (err, client) => {
      console.error('❌ 数据库连接池错误:', err);
    });

    this.pool.on('connect', (client) => {
      console.log('🔗 数据库客户端连接建立');
    });

    this.pool.on('remove', (client) => {
      console.log('🔌 数据库客户端连接移除');
    });
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      console.log('📊 执行SQL查询:', sql, params ? '参数:' : '', params || '');
      const result = await client.query(sql, params);
      return result;
    } catch (error) {
      console.error('❌ 数据库查询错误:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 事务执行错误:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// 创建单例实例
const dbConnection = new DatabaseConnection();

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL数据库连接成功');
    console.log(`当前数据库时间: ${result.rows[0].current_time}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL数据库连接失败:', error);
    return false;
  }
}

export async function initDatabase(): Promise<void> {
  try {
    console.log('🚀 初始化PostgreSQL数据库...');
    
    // 创建所有必需的表
    const createTableQueries = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 交易所表
      `CREATE TABLE IF NOT EXISTS exchanges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        api_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 市场数据表
      `CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        exchange VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        timestamp BIGINT NOT NULL,
        open DECIMAL(18,8) NOT NULL,
        high DECIMAL(18,8) NOT NULL,
        low DECIMAL(18,8) NOT NULL,
        close DECIMAL(18,8) NOT NULL,
        volume DECIMAL(18,8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exchange, symbol, timeframe, timestamp)
      );`,

      // 策略表
      `CREATE TABLE IF NOT EXISTS strategies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        parameters JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 交易信号表
      `CREATE TABLE IF NOT EXISTS trading_signals (
        id SERIAL PRIMARY KEY,
        strategy_id INTEGER REFERENCES strategies(id),
        exchange VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        signal_type VARCHAR(20) NOT NULL,
        price DECIMAL(18,8) NOT NULL,
        timestamp BIGINT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 订单表
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        exchange VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        order_type VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL,
        price DECIMAL(18,8),
        quantity DECIMAL(18,8) NOT NULL,
        filled_quantity DECIMAL(18,8) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        external_order_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 交易表
      `CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        order_id INTEGER REFERENCES orders(id),
        exchange VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL,
        price DECIMAL(18,8) NOT NULL,
        quantity DECIMAL(18,8) NOT NULL,
        fee DECIMAL(18,8) DEFAULT 0,
        external_trade_id VARCHAR(100),
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 风险配置表
      `CREATE TABLE IF NOT EXISTS risk_configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        max_position_size DECIMAL(18,8),
        max_daily_loss DECIMAL(18,8),
        stop_loss_percentage DECIMAL(5,2),
        take_profit_percentage DECIMAL(5,2),
        max_concurrent_trades INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 回测结果表
      `CREATE TABLE IF NOT EXISTS backtest_results (
        id SERIAL PRIMARY KEY,
        strategy_id INTEGER REFERENCES strategies(id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        initial_capital DECIMAL(18,8) NOT NULL,
        final_capital DECIMAL(18,8) NOT NULL,
        total_return DECIMAL(10,4),
        max_drawdown DECIMAL(10,4),
        win_rate DECIMAL(5,2),
        total_trades INTEGER,
        profitable_trades INTEGER,
        parameters JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 账户余额表
      `CREATE TABLE IF NOT EXISTS account_balances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        exchange VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        free DECIMAL(18,8) DEFAULT 0,
        locked DECIMAL(18,8) DEFAULT 0,
        total DECIMAL(18,8) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, exchange, asset)
      );`
    ];

    // 创建索引
    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_market_data_exchange_symbol ON market_data(exchange, symbol);',
      'CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_strategy_id ON trading_signals(strategy_id);',
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_timestamp ON trading_signals(timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);',
      'CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);',
      'CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON account_balances(user_id);'
    ];

    // 插入默认数据
    const insertDefaultDataQueries = [
      // 插入默认交易所
      `INSERT INTO exchanges (name, display_name, api_url) VALUES 
      ('binance', 'Binance', 'https://api.binance.com'),
      ('coinbase', 'Coinbase Pro', 'https://api.pro.coinbase.com'),
      ('okx', 'OKX', 'https://www.okx.com') 
      ON CONFLICT (name) DO NOTHING;`,

      // 插入默认管理员用户（密码: admin123）
      `INSERT INTO users (username, email, password_hash, role) 
      VALUES ('admin', 'admin@cryptoquant.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
      ON CONFLICT (username) DO NOTHING;`
    ];

    // 执行所有查询
    for (const query of [...createTableQueries, ...createIndexQueries, ...insertDefaultDataQueries]) {
      await pool.query(query);
    }

    console.log('✅ PostgreSQL数据库初始化完成');
    console.log('📊 创建了所有必需的表和索引');
    console.log('👤 创建了默认管理员用户 (admin/admin123)');
    
  } catch (error) {
    console.error('❌ PostgreSQL数据库初始化失败:', error);
    throw error;
  }
}

export { dbConnection, pool as default };