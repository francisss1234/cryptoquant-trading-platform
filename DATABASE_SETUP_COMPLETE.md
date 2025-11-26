# 🚀 CryptoQuant PostgreSQL 数据库配置完成

## ✅ 已完成配置

### 1. 数据库表结构设计
已创建以下核心表结构：

- **users** - 用户管理表
- **exchanges** - 交易所配置表  
- **market_data** - 市场数据表
- **strategies** - 交易策略表
- **trading_signals** - 交易信号表
- **orders** - 订单管理表
- **trades** - 交易记录表
- **risk_configs** - 风险控制配置表
- **backtest_results** - 回测结果表
- **account_balances** - 账户余额表

### 2. 数据库连接配置
- 数据库配置文件：`api/config/database.ts`
- 环境变量模板：`.env.example`
- 连接池配置：支持20个并发连接

### 3. 数据库初始化
- 自动创建所有必需的表和索引
- 插入默认交易所数据（Binance, Coinbase, OKX）
- 创建默认管理员用户（admin/admin123）

## 🛠️ 快速设置PostgreSQL

### 选项1: Docker快速部署（推荐）
```bash
# 启动PostgreSQL和pgAdmin
docker-compose up -d

# 验证数据库连接
node database/simple-test.ts
```

### 选项2: 本地PostgreSQL安装
1. 安装PostgreSQL
2. 创建数据库和用户
3. 更新`.env`文件中的连接参数

### 选项3: 云数据库服务
- **Supabase**（推荐免费层）
- **Railway** PostgreSQL
- **AWS RDS** 或 **Google Cloud SQL**

## 📋 环境变量配置

更新你的 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoquant
DB_USER=cryptoquant_user
DB_PASSWORD=your_secure_password
```

## 🧪 测试数据库连接

```bash
# 测试数据库连接
node database/simple-test.ts

# 完整数据库初始化
node database/test-connection.ts
```

## 🔧 数据库管理工具

### pgAdmin（已包含在Docker中）
- 访问：http://localhost:8080
- 邮箱：admin@cryptoquant.com
- 密码：admin_password

### 命令行工具
```bash
# 连接到数据库
psql -h localhost -U cryptoquant_user -d cryptoquant

# 查看表结构
\dt

# 查看表数据
SELECT * FROM users;
```

## 📊 数据库表关系图

```
users (1) ----< (N) strategies (1) ----< (N) trading_signals
  |                                      |
  |                                      |
  v                                      v
orders (1) ----< (N) trades     risk_configs (1) ----< (N) users
  |                                      |
  |                                      |
  v                                      v
account_balances (N) ----< (1) users    backtest_results (N) ----< (1) strategies
```

## 🚀 下一步操作

### 1. 设置PostgreSQL数据库
选择上述任一方式设置好PostgreSQL数据库

### 2. 测试连接
```bash
node database/simple-test.ts
```

### 3. 启动应用
```bash
npm run dev
```

### 4. 验证功能
- 访问 http://localhost:5173
- 使用管理员账户登录（admin/admin123）
- 测试各项功能是否正常工作

## 🔍 故障排除

### 常见问题
1. **连接被拒绝**：检查PostgreSQL服务是否运行
2. **认证失败**：确认用户名和密码正确
3. **数据库不存在**：手动创建数据库
4. **端口被占用**：修改端口配置

### 日志查看
```bash
# Docker日志
docker-compose logs

# 应用日志
npm run dev
```

## 📚 相关文件

- `api/config/database.ts` - 数据库连接配置
- `database/init-postgresql.sql` - SQL初始化脚本
- `database/test-connection.ts` - 数据库连接测试
- `docker-compose.yml` - Docker部署配置
- `database/POSTGRESQL_SETUP.md` - 详细设置指南

数据库配置已完成！你现在可以设置PostgreSQL数据库并启动应用了。