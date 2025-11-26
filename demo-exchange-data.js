// 模拟数据库中的交易所币种数据
const mockTradingPairs = [
  // Binance 交易对
  { symbol: 'BTCUSDT', exchange: 'binance', base_asset: 'BTC', quote_asset: 'USDT', price: 43250.50, volume_24h: 1250000000, change_percent_24h: 2.45, last_updated: '2025-11-26 14:30:00' },
  { symbol: 'ETHUSDT', exchange: 'binance', base_asset: 'ETH', quote_asset: 'USDT', price: 2650.75, volume_24h: 850000000, change_percent_24h: -1.23, last_updated: '2025-11-26 14:30:00' },
  { symbol: 'ADAUSDT', exchange: 'binance', base_asset: 'ADA', quote_asset: 'USDT', price: 0.485, volume_24h: 125000000, change_percent_24h: 5.67, last_updated: '2025-11-26 14:30:00' },
  { symbol: 'SOLUSDT', exchange: 'binance', base_asset: 'SOL', quote_asset: 'USDT', price: 198.50, volume_24h: 320000000, change_percent_24h: 8.92, last_updated: '2025-11-26 14:30:00' },
  { symbol: 'DOTUSDT', exchange: 'binance', base_asset: 'DOT', quote_asset: 'USDT', price: 7.85, volume_24h: 95000000, change_percent_24h: -2.34, last_updated: '2025-11-26 14:30:00' },
  
  // Coinbase 交易对
  { symbol: 'BTCUSD', exchange: 'coinbase', base_asset: 'BTC', quote_asset: 'USD', price: 43248.90, volume_24h: 450000000, change_percent_24h: 2.43, last_updated: '2025-11-26 14:28:00' },
  { symbol: 'ETHUSD', exchange: 'coinbase', base_asset: 'ETH', quote_asset: 'USD', price: 2649.20, volume_24h: 380000000, change_percent_24h: -1.25, last_updated: '2025-11-26 14:28:00' },
  { symbol: 'LTCUSD', exchange: 'coinbase', base_asset: 'LTC', quote_asset: 'USD', price: 72.30, volume_24h: 45000000, change_percent_24h: 1.87, last_updated: '2025-11-26 14:28:00' },
  { symbol: 'BCHUSD', exchange: 'coinbase', base_asset: 'BCH', quote_asset: 'USD', price: 485.60, volume_24h: 28000000, change_percent_24h: -0.95, last_updated: '2025-11-26 14:28:00' },
  
  // OKX 交易对
  { symbol: 'BTCUSDC', exchange: 'okx', base_asset: 'BTC', quote_asset: 'USDC', price: 43252.10, volume_24h: 680000000, change_percent_24h: 2.48, last_updated: '2025-11-26 14:32:00' },
  { symbol: 'ETHUSDC', exchange: 'okx', base_asset: 'ETH', quote_asset: 'USDC', price: 2651.40, volume_24h: 520000000, change_percent_24h: -1.21, last_updated: '2025-11-26 14:32:00' },
  { symbol: 'OKBUSDT', exchange: 'okx', base_asset: 'OKB', quote_asset: 'USDT', price: 42.85, volume_24h: 15000000, change_percent_24h: 3.12, last_updated: '2025-11-26 14:32:00' },
  { symbol: 'MATICUSDT', exchange: 'okx', base_asset: 'MATIC', quote_asset: 'USDT', price: 0.895, volume_24h: 75000000, change_percent_24h: 4.56, last_updated: '2025-11-26 14:32:00' },
];

function analyzeTradingPairs() {
  console.log('🔍 CryptoQuant 交易所币种数据分析');
  console.log('=' .repeat(60));
  console.log('');
  
  // 按交易所分组统计
  const exchangeStats = {};
  mockTradingPairs.forEach(pair => {
    if (!exchangeStats[pair.exchange]) {
      exchangeStats[pair.exchange] = {
        pairs: [],
        baseAssets: new Set(),
        quoteAssets: new Set(),
        totalVolume: 0,
        avgPrice: 0
      };
    }
    
    exchangeStats[pair.exchange].pairs.push(pair);
    exchangeStats[pair.exchange].baseAssets.add(pair.base_asset);
    exchangeStats[pair.exchange].quoteAssets.add(pair.quote_asset);
    exchangeStats[pair.exchange].totalVolume += pair.volume_24h;
  });
  
  // 计算每个交易所的平均价格
  Object.keys(exchangeStats).forEach(exchange => {
    const stats = exchangeStats[exchange];
    stats.avgPrice = stats.pairs.reduce((sum, pair) => sum + pair.price, 0) / stats.pairs.length;
  });
  
  console.log('🏢 === 各交易所统计概览 ===\n');
  
  const sortedExchanges = Object.keys(exchangeStats).sort((a, b) => 
    exchangeStats[b].pairs.length - exchangeStats[a].pairs.length
  );
  
  sortedExchanges.forEach((exchange, index) => {
    const stats = exchangeStats[exchange];
    console.log(`${index + 1}. 🏦 ${exchange.toUpperCase()}`);
    console.log(`   📈 交易对数量: ${stats.pairs.length}`);
    console.log(`   💰 基础币种: ${stats.baseAssets.size}`);
    console.log(`   💵 计价币种: ${stats.quoteAssets.size}`);
    console.log(`   💲 平均价格: $${stats.avgPrice.toFixed(4)}`);
    console.log(`   📊 24h总成交量: $${(stats.totalVolume / 1000000).toFixed(2)}M`);
    console.log(`   ⏰ 数据更新时间: ${stats.pairs[0]?.last_updated || 'N/A'}`);
    console.log('');
  });
  
  console.log('🔥 === 热门交易对 (按24h成交量排序) ===\n');
  
  const sortedByVolume = [...mockTradingPairs].sort((a, b) => b.volume_24h - a.volume_24h);
  
  sortedByVolume.slice(0, 15).forEach((pair, index) => {
    const changeIcon = pair.change_percent_24h >= 0 ? '📈' : '📉';
    const changeColor = pair.change_percent_24h >= 0 ? '+' : '';
    console.log(`${index + 1}. ${changeIcon} ${pair.symbol} (${pair.exchange.toUpperCase()})`);
    console.log(`   💰 当前价格: $${pair.price.toFixed(4)}`);
    console.log(`   📊 24h成交量: $${(pair.volume_24h / 1000000).toFixed(2)}M`);
    console.log(`   ${changeIcon} 24h涨跌幅: ${changeColor}${pair.change_percent_24h.toFixed(2)}%`);
    console.log(`   🪙 基础币种: ${pair.base_asset} | 计价币种: ${pair.quote_asset}`);
    console.log(`   ⏰ 更新时间: ${pair.last_updated}`);
    console.log('');
  });
  
  console.log('📊 === 币种分布统计 ===\n');
  
  const baseCoinStats = {};
  const quoteCoinStats = {};
  
  mockTradingPairs.forEach(pair => {
    // 基础币种统计
    if (!baseCoinStats[pair.base_asset]) {
      baseCoinStats[pair.base_asset] = { count: 0, exchanges: new Set(), avgPrice: 0 };
    }
    baseCoinStats[pair.base_asset].count++;
    baseCoinStats[pair.base_asset].exchanges.add(pair.exchange);
    
    // 计价币种统计
    if (!quoteCoinStats[pair.quote_asset]) {
      quoteCoinStats[pair.quote_asset] = { count: 0, avgVolume: 0 };
    }
    quoteCoinStats[pair.quote_asset].count++;
  });
  
  console.log('🪙 基础币种分布:');
  Object.entries(baseCoinStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .forEach(([coin, stats]) => {
      console.log(`   ${coin}: ${stats.count} 个交易对 (交易所: ${Array.from(stats.exchanges).join(', ')})`);
    });
  
  console.log('');
  console.log('💰 计价币种分布:');
  Object.entries(quoteCoinStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .forEach(([coin, stats]) => {
      console.log(`   ${coin}: ${stats.count} 个交易对`);
    });
  
  console.log('');
  console.log('🎯 === 价格波动分析 ===\n');
  
  const positiveChanges = mockTradingPairs.filter(p => p.change_percent_24h > 0);
  const negativeChanges = mockTradingPairs.filter(p => p.change_percent_24h < 0);
  const noChange = mockTradingPairs.filter(p => p.change_percent_24h === 0);
  
  console.log(`📈 上涨币种: ${positiveChanges.length} 个 (${(positiveChanges.length / mockTradingPairs.length * 100).toFixed(1)}%)`);
  console.log(`📉 下跌币种: ${negativeChanges.length} 个 (${(negativeChanges.length / mockTradingPairs.length * 100).toFixed(1)}%)`);
  console.log(`➡️  无变化: ${noChange.length} 个 (${(noChange.length / mockTradingPairs.length * 100).toFixed(1)}%)`);
  
  if (positiveChanges.length > 0) {
    const maxGain = Math.max(...positiveChanges.map(p => p.change_percent_24h));
    const avgGain = positiveChanges.reduce((sum, p) => sum + p.change_percent_24h, 0) / positiveChanges.length;
    console.log(`   最大涨幅: ${maxGain.toFixed(2)}%`);
    console.log(`   平均涨幅: ${avgGain.toFixed(2)}%`);
  }
  
  if (negativeChanges.length > 0) {
    const maxLoss = Math.min(...negativeChanges.map(p => p.change_percent_24h));
    const avgLoss = negativeChanges.reduce((sum, p) => sum + p.change_percent_24h, 0) / negativeChanges.length;
    console.log(`   最大跌幅: ${maxLoss.toFixed(2)}%`);
    console.log(`   平均跌幅: ${avgLoss.toFixed(2)}%`);
  }
  
  console.log('');
  console.log('✅ 数据检查完成！');
  console.log('=' .repeat(60));
}

// 执行分析
analyzeTradingPairs();