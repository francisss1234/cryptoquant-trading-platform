-- CryptoQuant PostgreSQL 数据库初始化脚本
-- 创建数据库和表结构

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS cryptoquant;

-- 使用数据库
\c cryptoquant;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建交易所配置表
CREATE TABLE IF NOT EXISTS exchanges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建市场数据表
CREATE TABLE IF NOT EXISTS market_data (
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
);

-- 创建交易策略表
CREATE TABLE IF NOT EXISTS strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    strategy_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建交易信号表
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES strategies(id),
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(20) NOT NULL,
    signal_strength DECIMAL(5,2),
    price DECIMAL(18,8),
    timestamp BIGINT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_id INTEGER REFERENCES strategies(id),
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8),
    stop_price DECIMAL(18,8),
    status VARCHAR(20) DEFAULT 'pending',
    exchange_order_id VARCHAR(100),
    filled_quantity DECIMAL(18,8) DEFAULT 0,
    average_price DECIMAL(18,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8) NOT NULL,
    fee DECIMAL(18,8) DEFAULT 0,
    fee_currency VARCHAR(10),
    timestamp BIGINT NOT NULL,
    exchange_trade_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建风险管理配置表
CREATE TABLE IF NOT EXISTS risk_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_id INTEGER REFERENCES strategies(id),
    max_position_size DECIMAL(18,8),
    max_daily_loss DECIMAL(18,8),
    max_drawdown DECIMAL(5,2),
    stop_loss_percentage DECIMAL(5,2),
    take_profit_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建回测结果表
CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES strategies(id),
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    initial_capital DECIMAL(18,8) NOT NULL,
    final_capital DECIMAL(18,8) NOT NULL,
    total_return DECIMAL(10,4),
    max_drawdown DECIMAL(10,4),
    sharpe_ratio DECIMAL(10,4),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    win_rate DECIMAL(5,2),
    profit_factor DECIMAL(10,4),
    equity_curve JSONB,
    trades_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建账户余额表
CREATE TABLE IF NOT EXISTS account_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    exchange VARCHAR(50) NOT NULL,
    asset VARCHAR(20) NOT NULL,
    free_balance DECIMAL(18,8) DEFAULT 0,
    locked_balance DECIMAL(18,8) DEFAULT 0,
    total_balance DECIMAL(18,8) DEFAULT 0,
    usd_value DECIMAL(18,8) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exchange, asset)
);

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    module VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建性能监控表
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18,8) NOT NULL,
    tags JSONB,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_market_data_exchange_symbol_timeframe 
ON market_data(exchange, symbol, timeframe);

CREATE INDEX IF NOT EXISTS idx_market_data_timestamp 
ON market_data(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trading_signals_strategy_id 
ON trading_signals(strategy_id);

CREATE INDEX IF NOT EXISTS idx_trading_signals_timestamp 
ON trading_signals(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_trades_order_id 
ON trades(order_id);

CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy_id 
ON backtest_results(strategy_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp 
ON performance_metrics(metric_name, timestamp DESC);

-- 插入示例数据
INSERT INTO users (username, email, password_hash) VALUES 
('admin', 'admin@cryptoquant.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('trader1', 'trader1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('trader2', 'trader2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 插入示例交易所配置
INSERT INTO exchanges (name, api_key, api_secret, is_active) VALUES 
('binance', 'demo_api_key_1', 'demo_api_secret_1', true),
('okx', 'demo_api_key_2', 'demo_api_secret_2', true),
('coinbase', 'demo_api_key_3', 'demo_api_secret_3', true);

-- 插入示例市场数据
INSERT INTO market_data (exchange, symbol, timeframe, timestamp, open, high, low, close, volume) VALUES 
('binance', 'BTCUSDT', '1h', 1704067200000, 42000.00, 42500.00, 41800.00, 42300.00, 1250.50),
('binance', 'BTCUSDT', '1h', 1704070800000, 42300.00, 42800.00, 42100.00, 42600.00, 1180.75),
('binance', 'ETHUSDT', '1h', 1704067200000, 2200.00, 2250.00, 2180.00, 2230.00, 8500.25),
('okx', 'BTCUSDT', '1h', 1704067200000, 42100.00, 42400.00, 41900.00, 42200.00, 980.60),
('coinbase', 'BTCUSDT', '1h', 1704067200000, 42050.00, 42450.00, 41850.00, 42350.00, 750.30);

-- 插入示例策略
INSERT INTO strategies (user_id, name, description, strategy_type, parameters, is_active) VALUES 
(1, 'Moving Average Crossover', 'Simple MA crossover strategy', 'trend_following', '{"fast_period": 20, "slow_period": 50, "signal_period": 9}', true),
(1, 'RSI Mean Reversion', 'RSI-based mean reversion strategy', 'mean_reversion', '{"rsi_period": 14, "oversold": 30, "overbought": 70}', true),
(2, 'MACD Momentum', 'MACD-based momentum strategy', 'momentum', '{"fast_period": 12, "slow_period": 26, "signal_period": 9}', true);

-- 插入示例交易信号
INSERT INTO trading_signals (strategy_id, exchange, symbol, signal_type, signal_strength, price, timestamp, metadata) VALUES 
(1, 'binance', 'BTCUSDT', 'BUY', 0.85, 42300.00, 1704067200000, '{"ma_fast": 42200, "ma_slow": 42100}'),
(1, 'binance', 'BTCUSDT', 'SELL', 0.75, 42600.00, 1704070800000, '{"ma_fast": 42500, "ma_slow": 42650}'),
(2, 'binance', 'ETHUSDT', 'BUY', 0.90, 2230.00, 1704067200000, '{"rsi": 28.5}'),
(3, 'okx', 'BTCUSDT', 'BUY', 0.80, 42200.00, 1704067200000, '{"macd": 150, "signal": 100}');

-- 插入示例订单
INSERT INTO orders (user_id, strategy_id, exchange, symbol, order_type, side, quantity, price, status) VALUES 
(1, 1, 'binance', 'BTCUSDT', 'limit', 'buy', 0.1, 42300.00, 'filled'),
(1, 1, 'binance', 'BTCUSDT', 'limit', 'sell', 0.1, 42600.00, 'filled'),
(2, 2, 'binance', 'ETHUSDT', 'limit', 'buy', 1.0, 2230.00, 'filled'),
(3, 3, 'okx', 'BTCUSDT', 'limit', 'buy', 0.05, 42200.00, 'pending');

-- 插入示例交易记录
INSERT INTO trades (order_id, exchange, symbol, side, quantity, price, fee, fee_currency, timestamp) VALUES 
(1, 'binance', 'BTCUSDT', 'buy', 0.1, 42300.00, 4.23, 'USDT', 1704067200000),
(2, 'binance', 'BTCUSDT', 'sell', 0.1, 42600.00, 4.26, 'USDT', 1704070800000),
(3, 'binance', 'ETHUSDT', 'buy', 1.0, 2230.00, 2.23, 'USDT', 1704067200000);

-- 插入示例风险管理配置
INSERT INTO risk_configs (user_id, strategy_id, max_position_size, max_daily_loss, max_drawdown, stop_loss_percentage, take_profit_percentage, is_active) VALUES 
(1, 1, 1.0, 1000.00, 10.00, 5.00, 10.00, true),
(1, 2, 0.5, 500.00, 8.00, 3.00, 8.00, true),
(2, 3, 0.8, 800.00, 12.00, 6.00, 12.00, true);

-- 插入示例回测结果
INSERT INTO backtest_results (strategy_id, exchange, symbol, timeframe, start_date, end_date, initial_capital, final_capital, total_return, max_drawdown, sharpe_ratio, total_trades, winning_trades, losing_trades, win_rate, profit_factor, equity_curve, trades_data) VALUES 
(1, 'binance', 'BTCUSDT', '1h', '2023-01-01', '2023-12-31', 10000.00, 12500.00, 25.00, 15.00, 1.5, 120, 78, 42, 65.00, 1.8, '[10000, 10200, 10500, 12000, 12500]', '[{"entry": 42000, "exit": 42600, "profit": 300}]'),
(2, 'binance', 'ETHUSDT', '1h', '2023-01-01', '2023-12-31', 5000.00, 5800.00, 16.00, 12.00, 1.3, 85, 55, 30, 64.71, 1.6, '[5000, 5100, 5300, 5600, 5800]', '[{"entry": 2200, "exit": 2230, "profit": 30}]'),
(3, 'okx', 'BTCUSDT', '1h', '2023-01-01', '2023-12-31', 8000.00, 9200.00, 15.00, 18.00, 1.2, 95, 60, 35, 63.16, 1.4, '[8000, 8200, 8500, 9000, 9200]', '[{"entry": 42100, "exit": 42200, "profit": 100}]');

-- 插入示例账户余额
INSERT INTO account_balances (user_id, exchange, asset, free_balance, locked_balance, total_balance, usd_value, last_updated) VALUES 
(1, 'binance', 'BTC', 0.5, 0.0, 0.5, 21150.00, '2024-01-01 00:00:00'),
(1, 'binance', 'USDT', 5000.00, 0.0, 5000.00, 5000.00, '2024-01-01 00:00:00'),
(1, 'binance', 'ETH', 2.0, 0.0, 2.0, 4460.00, '2024-01-01 00:00:00'),
(2, 'binance', 'BTC', 0.3, 0.0, 0.3, 12690.00, '2024-01-01 00:00:00'),
(2, 'binance', 'USDT', 3000.00, 0.0, 3000.00, 3000.00, '2024-01-01 00:00:00'),
(3, 'okx', 'BTC', 0.2, 0.0, 0.2, 8440.00, '2024-01-01 00:00:00'),
(3, 'okx', 'USDT', 2000.00, 0.0, 2000.00, 2000.00, '2024-01-01 00:00:00');

-- 插入示例系统日志
INSERT INTO system_logs (level, module, message, metadata) VALUES 
('INFO', 'Database', 'Database initialized successfully', '{"version": "1.0.0"}'),
('INFO', 'StrategyEngine', 'Strategy Moving Average Crossover started', '{"strategy_id": 1}'),
('INFO', 'MarketData', 'Market data feed connected for BTCUSDT', '{"exchange": "binance", "symbol": "BTCUSDT"}'),
('INFO', 'RiskManager', 'Risk management system initialized', '{"user_id": 1}'),
('INFO', 'BacktestEngine', 'Backtest completed for strategy 1', '{"strategy_id": 1, "return": 25.0}');

-- 插入示例性能指标
INSERT INTO performance_metrics (metric_name, metric_value, tags, timestamp) VALUES 
('system.cpu.usage', 45.2, '{"host": "server1"}', 1704067200000),
('system.memory.usage', 68.5, '{"host": "server1"}', 1704067200000),
('strategy.performance', 25.0, '{"strategy_id": 1, "type": "total_return"}', 1704067200000),
('api.response.time', 120.5, '{"endpoint": "/api/market/data"}', 1704067200000),
('websocket.connections', 150, '{"type": "active_connections"}', 1704067200000);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_configs_updated_at BEFORE UPDATE ON risk_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建账户余额更新的触发器
CREATE OR REPLACE FUNCTION update_account_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_balances_timestamp BEFORE UPDATE ON account_balances
    FOR EACH ROW EXECUTE FUNCTION update_account_balance_timestamp();

-- 设置表权限（根据实际需求调整）
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cryptoquant_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryptoquant_user;

-- 创建数据库备份函数
CREATE OR REPLACE FUNCTION backup_database_data()
RETURNS TABLE(backup_info TEXT) AS $$
BEGIN
    RETURN QUERY SELECT 'Database backup completed at ' || CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 创建数据清理函数（保留最近90天的数据）
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- 清理90天前的系统日志
    DELETE FROM system_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 清理90天前的性能指标
    DELETE FROM performance_metrics WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建性能监控视图
CREATE OR REPLACE VIEW strategy_performance_summary AS
SELECT 
    s.id as strategy_id,
    s.name as strategy_name,
    s.strategy_type,
    COUNT(ts.id) as total_signals,
    COUNT(CASE WHEN ts.signal_type = 'BUY' THEN 1 END) as buy_signals,
    COUNT(CASE WHEN ts.signal_type = 'SELL' THEN 1 END) as sell_signals,
    AVG(ts.signal_strength) as avg_signal_strength,
    MAX(ts.timestamp) as last_signal_time
FROM strategies s
LEFT JOIN trading_signals ts ON s.id = ts.strategy_id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.strategy_type;

-- 创建账户总览视图
CREATE OR REPLACE VIEW account_overview AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT ab.exchange) as connected_exchanges,
    SUM(ab.total_balance * ab.usd_value) as total_portfolio_value,
    COUNT(DISTINCT s.id) as active_strategies,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(CASE WHEN o.status = 'filled' THEN o.filled_quantity * o.average_price ELSE 0 END) as total_traded_volume
FROM users u
LEFT JOIN account_balances ab ON u.id = ab.user_id
LEFT JOIN strategies s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username, u.email;

-- 创建交易统计视图
CREATE OR REPLACE VIEW trading_statistics AS
SELECT 
    exchange,
    symbol,
    COUNT(*) as total_trades,
    SUM(quantity) as total_volume,
    AVG(price) as avg_price,
    SUM(fee) as total_fees,
    MIN(price) as min_price,
    MAX(price) as max_price,
    COUNT(CASE WHEN side = 'buy' THEN 1 END) as buy_trades,
    COUNT(CASE WHEN side = 'sell' THEN 1 END) as sell_trades
FROM trades
GROUP BY exchange, symbol;

-- 显示创建结果
SELECT '数据库初始化完成！' as message;
SELECT '表结构：' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT '示例数据已插入！' as message;
SELECT '用户数量：' || COUNT(*) FROM users;
SELECT '交易所配置：' || COUNT(*) FROM exchanges;
SELECT '策略数量：' || COUNT(*) FROM strategies;
SELECT '交易信号：' || COUNT(*) FROM trading_signals;
SELECT '订单数量：' || COUNT(*) FROM orders;
SELECT '交易记录：' || COUNT(*) FROM trades;