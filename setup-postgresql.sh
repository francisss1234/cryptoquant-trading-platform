#!/bin/bash

# CryptoQuant PostgreSQL 数据库快速设置脚本

echo "🚀 CryptoQuant PostgreSQL 数据库设置"
echo "========================================"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "访问: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 停止现有的容器
echo "🛑 停止现有容器..."
docker-compose down

# 启动PostgreSQL和pgAdmin
echo "🚀 启动PostgreSQL数据库..."
docker-compose up -d

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 检查数据库是否运行
echo "🔍 检查数据库状态..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ PostgreSQL数据库启动成功"
    echo "📊 pgAdmin管理界面: http://localhost:8080"
    echo "   邮箱: admin@cryptoquant.com"
    echo "   密码: admin_password"
else
    echo "❌ PostgreSQL数据库启动失败"
    echo "请查看日志: docker-compose logs"
    exit 1
fi

# 测试数据库连接
echo "🧪 测试数据库连接..."
cd database
if node simple-test.ts; then
    echo "✅ 数据库连接测试通过"
else
    echo "❌ 数据库连接测试失败"
    echo "请检查:"
    echo "1. Docker容器是否正常运行"
    echo "2. 环境变量配置是否正确"
    echo "3. 端口5432是否被占用"
    exit 1
fi

echo ""
echo "🎉 PostgreSQL数据库设置完成！"
echo "================================"
echo "数据库连接信息:"
echo "  主机: localhost"
echo "  端口: 5432"
echo "  数据库: cryptoquant"
echo "  用户名: cryptoquant_user"
echo "  密码: cryptoquant_password"
echo ""
echo "pgAdmin管理界面: http://localhost:8080"
echo ""
echo "下一步:"
echo "1. 运行数据库初始化: node database/test-connection.ts"
echo "2. 启动应用: npm run dev"
echo "3. 访问网站: http://localhost:5173"