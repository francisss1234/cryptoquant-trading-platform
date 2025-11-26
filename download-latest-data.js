import fetch from 'node-fetch';
import { Client } from 'pg';

// 数据库连接配置
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'da111111',
  database: 'cryptoqs'
};

/**
 * 获取Binance交易对数据
 */
async function fetchBinanceData() {
  try {
    console.log('📊 获取Binance交易对数据...');
    
    // 获取交易对信息
    const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const exchangeInfo = await exchangeInfoResponse.json();
    
    // 获取24小时统计数据
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const tickers = await tickerResponse.json();
    
    if (!exchangeInfo.symbols || !Array.isArray(tickers)) {
      throw new Error('Invalid Binance API response');
    }
    
    // 创建交易对映射
    const tickerMap = new Map();
    tickers.forEach(ticker => {
      tickerMap.set(ticker.symbol, ticker);
    });
    
    // 转换数据格式
    const tradingPairs = exchangeInfo.symbols
      .filter(symbol => symbol.status === 'TRADING')
      .map(symbol => {
        const ticker = tickerMap.get(symbol.symbol) || {};
        return {
          symbol: symbol.symbol,
          base_asset: symbol.baseAsset,
          quote_asset: symbol.quoteAsset,
          status: symbol.status,
          min_notional: symbol.filters?.find(f => f.filterType === 'MIN_NOTIONAL')?.minNotional || '0',
          updated_at: Date.now().toString()
        };
      });
    
    console.log(`✅ Binance: 获取到 ${tradingPairs.length} 个交易对`);
    return tradingPairs;
    
  } catch (error) {
    console.error('❌ Binance数据获取失败:', error.message);
    return [];
  }
}

/**
 * 保存交易对数据到数据库
 */
async function saveTradingPairs(pairs, tableName) {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    
    // 清空现有数据
    await client.query(`TRUNCATE TABLE ${tableName}`);
    console.log(`🗑️  已清空 ${tableName} 表`);
    
    // 批量插入数据
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      
      const values = batch.map((pair, index) => 
        `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
      ).join(',');
      
      const query = `
        INSERT INTO ${tableName} (symbol, base_asset, quote_asset, status, min_notional, updated_at)
        VALUES ${values}
      `;
      
      const params = batch.flatMap(pair => [
        pair.symbol,
        pair.base_asset,
        pair.quote_asset,
        pair.status,
        pair.min_notional,
        pair.updated_at
      ]);
      
      await client.query(query, params);
      inserted += batch.length;
      
      console.log(`⏳ 已插入 ${inserted}/${pairs.length} 条记录`);
    }
    
    console.log(`✅ 成功保存 ${inserted} 个交易对到 ${tableName}`);
    
  } catch (error) {
    console.error(`❌ 保存到 ${tableName} 失败:`, error.message);
  } finally {
    await client.end();
  }
}

/**
 * 主函数 - 下载最新数据
 */
async function downloadLatestData() {
  console.log('🚀 开始下载最新交易所币种数据...\n');
  console.log('⏰ 开始时间:', new Date().toLocaleString());
  
  try {
    // 下载Binance数据
    const binancePairs = await fetchBinanceData();
    
    if (binancePairs.length > 0) {
      // 保存到现货交易对表
      await saveTradingPairs(binancePairs, 'spot_pairs');
    }
    
    console.log('\n✅ 数据下载完成！');
    console.log('⏰ 结束时间:', new Date().toLocaleString());
    
    // 显示统计信息
    const client = new Client(DB_CONFIG);
    await client.connect();
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_pairs,
        COUNT(DISTINCT base_asset) as base_currencies,
        COUNT(DISTINCT quote_asset) as quote_currencies
      FROM spot_pairs
    `);
    
    console.log('\n📊 数据统计:');
    console.log(`   总交易对: ${statsResult.rows[0].total_pairs}`);
    console.log(`   基础币种: ${statsResult.rows[0].base_currencies}`);
    console.log(`   计价币种: ${statsResult.rows[0].quote_currencies}`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ 数据下载失败:', error.message);
  }
}

// 执行下载
downloadLatestData();