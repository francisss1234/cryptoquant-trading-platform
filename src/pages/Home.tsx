import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Shield, Zap, PieChart, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">CryptoQuant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/market" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                市场数据
              </Link>
              <Link 
                to="/strategies" 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                策略管理
              </Link>
              <Link 
                to="/trading" 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                交易执行
              </Link>
              <Link 
                to="/risk" 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                风险管理
              </Link>
              <Link 
                to="/visualization" 
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                可视化分析
              </Link>
              <Link 
                to="/websocket-demo" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>实时数据</span>
              </Link>
              <Link 
                to="/realtime-demo" 
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>WebSocket演示</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 英雄区域 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            专业的数字货币量化交易平台
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            集数据采集、策略开发、回测分析、自动交易和风险管理于一体的完整量化交易解决方案
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/market" 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              开始体验
            </Link>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              了解更多
            </button>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">实时数据采集</h3>
            <p className="text-gray-600 text-sm">
              支持多个主流交易所的实时数据获取，包括价格、成交量、订单簿等完整市场数据
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">策略开发</h3>
            <p className="text-gray-600 text-sm">
              提供丰富的技术指标和策略模板，支持自定义策略开发和回测验证
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">风险管理</h3>
            <p className="text-gray-600 text-sm">
              完善的风险控制体系，包括止损止盈、仓位管理、风险指标监控等功能
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">可视化分析</h3>
            <p className="text-gray-600 text-sm">
              提供丰富的图表和可视化工具，帮助分析交易策略的绩效表现和风险指标
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">自动交易</h3>
            <p className="text-gray-600 text-sm">
              支持自动化交易执行，24小时不间断监控市场并执行交易策略
            </p>
          </div>
        </div>

        {/* 系统架构 */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">系统架构</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">前端技术栈</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• React 18 + TypeScript - 现代化前端框架</li>
                <li>• Tailwind CSS - 实用优先的CSS框架</li>
                <li>• Zustand - 轻量级状态管理</li>
                <li>• Recharts - 数据可视化图表库</li>
                <li>• React Router - 单页应用路由</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">后端技术栈</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Node.js + Express - 高性能后端服务</li>
                <li>• PostgreSQL - 强大的关系型数据库</li>
                <li>• CCXT - 统一的交易SDK</li>
                <li>• WebSocket - 实时数据通信</li>
                <li>• JWT - 安全的身份认证</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 支持的交易所 */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">支持的交易所</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Binance', 'Coinbase', 'OKX', 'Kraken', 'Bybit', 'Gate.io', 'KuCoin', 'MEXC'].map(exchange => (
              <div key={exchange} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">{exchange}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 CryptoQuant. 专业的数字货币量化交易平台.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}