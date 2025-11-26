# PostgreSQL 数据库设置指南

## 选项1: 使用本地PostgreSQL (推荐用于开发)

### 1. 安装PostgreSQL
- Windows: 下载并安装 [PostgreSQL官方安装程序](https://www.postgresql.org/download/windows/)
- macOS: `brew install postgresql`
- Linux: `sudo apt-get install postgresql postgresql-contrib`

### 2. 创建数据库和用户
```sql
-- 以管理员身份登录PostgreSQL
sudo -u postgres psql

-- 创建数据库
CREATE DATABASE cryptoquant;

-- 创建用户并设置密码
CREATE USER cryptoquant_user WITH PASSWORD 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE cryptoquant TO cryptoquant_user;

-- 退出
\q
```

### 3. 更新环境变量
修改 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoquant
DB_USER=cryptoquant_user
DB_PASSWORD=your_secure_password
```

## 选项2: 使用Docker (推荐)

### 1. 安装Docker
下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 2. 创建docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: cryptoquant-postgres
    environment:
      POSTGRES_DB: cryptoquant
      POSTGRES_USER: cryptoquant_user
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. 启动PostgreSQL
```bash
docker-compose up -d
```

## 选项3: 使用云数据库 (生产环境推荐)

### 1. 选择云服务提供商
- **Supabase** (推荐): 免费层提供PostgreSQL
- **Railway**: 简单易用的PostgreSQL托管
- **Aiven**: 专业的PostgreSQL托管服务
- **AWS RDS**: 亚马逊云PostgreSQL
- **Google Cloud SQL**: 谷歌云PostgreSQL

### 2. Supabase设置 (免费推荐)
1. 访问 [Supabase](https://supabase.com)
2. 注册账户并创建新项目
3. 在项目设置中找到数据库连接信息
4. 更新 `.env` 文件中的连接参数

## 数据库初始化

选择以上任一方式设置好PostgreSQL后，运行：

```bash
# 测试连接
node database/simple-test.ts

# 初始化数据库表
node database/test-connection.ts
```

## 故障排除

### 常见问题

1. **连接被拒绝**
   - 确保PostgreSQL服务正在运行
   - 检查防火墙设置
   - 确认端口5432是否开放

2. **认证失败**
   - 检查用户名和密码
   - 确保用户有数据库访问权限
   - 尝试重置密码

3. **数据库不存在**
   - 手动创建数据库
   - 检查数据库名称拼写

### 验证安装

```bash
# 检查PostgreSQL版本
psql --version

# 连接到数据库
psql -h localhost -U cryptoquant_user -d cryptoquant

# 查看表
\dt

# 退出
\q
```

## 下一步

数据库设置完成后，我们将：
1. 更新API配置使用PostgreSQL
2. 迁移现有数据到数据库
3. 配置数据库备份和监控