# CryptoQuant 数据库连接配置
# 生成时间: 2025年11月26日
# 用途: 记录数据库连接信息，方便以后获取连接

## PostgreSQL 数据库连接信息

### ✅ 验证通过的连接配置
**用户名**: postgres  
**密码**: da111111  
**主机**: localhost  
**端口**: 5432  
**可用数据库**:
  - postgres (系统数据库)
  - cryptoqs (主要业务数据库，包含交易数据)

### ❌ 无效配置
**用户名**: cryptoqs (密码 da111111 无效)  
**用户名**: cryptoquant_user (密码 da111111 无效)

### 数据库连接字符串
```javascript
// Node.js 连接配置
const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'da111111',
  database: 'cryptoqs'  // 或 'postgres'
};

// PostgreSQL 连接 URI
const connectionString = 'postgresql://postgres:da111111@localhost:5432/cryptoqs';
```

### 命令行连接
```bash
# 连接到 cryptoqs 数据库
psql -U postgres -h localhost -d cryptoqs

# 连接到 postgres 数据库
psql -U postgres -h localhost -d postgres
```

## 数据库表信息 (cryptoqs)

### 交易相关表
- **spot_pairs**: 现货交易对 (3,395 条记录)
- **futures_pairs**: 期货交易对 (637 条记录)  
- **margin_pairs**: 杠杆交易对 (2 条记录)
- **bars**: K线数据 (90,075 条记录)
- **trades**: 交易数据
- **depth**: 深度数据

### 模拟交易表
- **sim_orders**: 模拟订单 (1,203 条记录)
- **sim_positions**: 模拟持仓 (2 条记录)
- **sim_trades**: 模拟交易 (1,203 条记录)

### 其他表
- **symbols**: 交易品种信息

## 使用示例

### JavaScript/Node.js
```javascript
import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'cryptoqs',
  user: 'postgres',
  password: 'da111111'
});

await client.connect();
// 执行数据库操作
await client.end();
```

### SQL 查询示例
```sql
-- 查看所有现货交易对
SELECT * FROM spot_pairs LIMIT 10;

-- 统计交易对数量
SELECT COUNT(*) FROM spot_pairs WHERE status = 'TRADING';

-- 查看主要币种
SELECT base_asset, COUNT(*) as pair_count 
FROM spot_pairs 
GROUP BY base_asset 
ORDER BY pair_count DESC 
LIMIT 10;
```

## 注意事项
1. 密码已验证有效，请妥善保管此文件
2. 生产环境建议使用环境变量存储密码
3. 定期备份数据库
4. 监控数据库连接和性能

## 最后验证
- ✅ 密码验证通过: da111111 (仅 postgres 用户)
- ✅ 可连接数据库: postgres, cryptoqs  
- ✅ 包含交易数据: 4,034 个交易对
- ✅ 最后更新: 2025年11月26日