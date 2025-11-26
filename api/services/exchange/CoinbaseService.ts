import { BaseExchangeService, TradingPair, ExchangeConfig } from './ExchangeService';
import { logger } from '../../utils/logger';

export class CoinbaseService extends BaseExchangeService {
  constructor(apiKey?: string, apiSecret?: string) {
    const config: ExchangeConfig = {
      name: 'coinbase',
      displayName: 'Coinbase Pro',
      apiBaseUrl: 'https://api.pro.coinbase.com',
      apiKey,
      apiSecret,
      rateLimit: 334, // 3 requests per second = 334ms between requests
      enabled: true,
    };
    super(config);
  }

  async getExchangeInfo(): Promise<any> {
    try {
      const [products, currencies] = await Promise.all([
        this.httpClient.get('/products'),
        this.httpClient.get('/currencies')
      ]);

      return {
        products: products.data,
        currencies: currencies.data
      };
    } catch (error) {
      logger.error('Coinbase获取交易所信息失败:', error);
      throw error;
    }
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    try {
      logger.info('🔄 开始获取Coinbase交易对数据...');
      
      const [exchangeInfo, stats24h] = await Promise.all([
        this.getExchangeInfo(),
        this.get24hrStats()
      ]);

      const products = exchangeInfo.products || [];
      const stats = stats24h || [];

      // 创建统计数据的映射
      const statsMap = new Map();
      stats.forEach((stat: any) => {
        statsMap.set(stat.product_id || stat.productId, stat);
      });

      // 过滤出正在交易的交易对
      const tradingPairs = products
        .filter((product: any) => product.status === 'online')
        .map((product: any) => {
          const stat = statsMap.get(product.id);
          
          return this.normalizeTradingPair({
            symbol: product.id,
            baseAsset: product.base_currency,
            quoteAsset: product.quote_currency,
            status: product.status,
            price: stat?.last || '0',
            volume24h: stat?.volume || '0',
            high24h: stat?.high || '0',
            low24h: stat?.low || '0',
            change24h: stat?.open && stat?.last ? (parseFloat(stat.last) - parseFloat(stat.open)).toString() : '0',
            changePercent24h: stat?.open && stat?.last ? (((parseFloat(stat.last) - parseFloat(stat.open)) / parseFloat(stat.open)) * 100).toString() : '0',
            base_min_size: product.base_min_size,
            base_max_size: product.base_max_size,
            min_market_funds: product.min_market_funds,
            max_market_funds: product.max_market_funds,
            quote_increment: product.quote_increment,
            base_increment: product.base_increment,
          });
        });

      logger.info(`✅ 成功获取 ${tradingPairs.length} 个Coinbase交易对数据`);
      return tradingPairs;
    } catch (error) {
      logger.error('Coinbase获取交易对数据失败:', error);
      throw error;
    }
  }

  async getTradingPair(symbol: string): Promise<TradingPair | null> {
    try {
      const [product, stats] = await Promise.all([
        this.httpClient.get(`/products/${symbol}`),
        this.httpClient.get(`/products/${symbol}/stats`)
      ]);

      const productData = product.data;
      const statsData = stats.data;

      return this.normalizeTradingPair({
        symbol: productData.id,
        baseAsset: productData.base_currency,
        quoteAsset: productData.quote_currency,
        status: productData.status,
        price: statsData.last || '0',
        volume24h: statsData.volume || '0',
        high24h: statsData.high || '0',
        low24h: statsData.low || '0',
        change24h: statsData.open && statsData.last ? (parseFloat(statsData.last) - parseFloat(statsData.open)).toString() : '0',
        changePercent24h: statsData.open && statsData.last ? (((parseFloat(statsData.last) - parseFloat(statsData.open)) / parseFloat(statsData.open)) * 100).toString() : '0',
        base_min_size: productData.base_min_size,
        base_max_size: productData.base_max_size,
        min_market_funds: productData.min_market_funds,
        max_market_funds: productData.max_market_funds,
        quote_increment: productData.quote_increment,
        base_increment: productData.base_increment,
      });
    } catch (error) {
      logger.error(`Coinbase获取交易对 ${symbol} 数据失败:`, error);
      return null;
    }
  }

  async getTickerData(symbol: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/products/${symbol}/ticker`);
      return response.data;
    } catch (error) {
      logger.error(`Coinbase获取 ${symbol} 行情数据失败:`, error);
      throw error;
    }
  }

  async get24hrTicker(symbol: string): Promise<any> {
    return this.get24hrStatsForProduct(symbol);
  }

  async get24hrStats(): Promise<any[]> {
    try {
      const products = await this.httpClient.get('/products');
      const productIds = products.data.map((p: any) => p.id);
      
      // 分批获取统计数据，避免速率限制
      const batchSize = 10;
      const stats = [];
      
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const batchStats = await Promise.all(
          batch.map(id => this.get24hrStatsForProduct(id).catch(err => {
            logger.warn(`Coinbase获取 ${id} 统计数据失败:`, err.message);
            return null;
          }))
        );
        
        stats.push(...batchStats.filter(stat => stat !== null));
        
        // 等待速率限制
        if (i + batchSize < productIds.length) {
          await new Promise(resolve => setTimeout(resolve, this.config.rateLimit));
        }
      }
      
      return stats;
    } catch (error) {
      logger.error('Coinbase获取24小时统计数据失败:', error);
      throw error;
    }
  }

  private async get24hrStatsForProduct(productId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/products/${productId}/stats`);
      return {
        product_id: productId,
        ...response.data
      };
    } catch (error) {
      logger.error(`Coinbase获取 ${productId} 统计数据失败:`, error);
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    try {
      const response = await this.httpClient.get(`/products/${symbol}/book`, {
        params: { level: limit <= 50 ? 1 : 2 } // level 1: 最佳买卖，level 2: 50条深度
      });
      return response.data;
    } catch (error) {
      logger.error(`Coinbase获取 ${symbol} 订单簿失败:`, error);
      throw error;
    }
  }

  // 获取K线数据（Coinbase称为candles）
  async getCandles(symbol: string, granularity: number = 3600, start?: string, end?: string, limit: number = 300): Promise<any[]> {
    try {
      const params: any = { granularity };
      if (start) params.start = start;
      if (end) params.end = end;
      if (limit) params.limit = Math.min(limit, 300); // Coinbase最大300条

      const response = await this.httpClient.get(`/products/${symbol}/candles`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Coinbase获取 ${symbol} K线数据失败:`, error);
      throw error;
    }
  }

  // 获取最新成交
  async getTrades(symbol: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.httpClient.get(`/products/${symbol}/trades`, {
        params: { limit: Math.min(limit, 100) }
      });
      return response.data;
    } catch (error) {
      logger.error(`Coinbase获取 ${symbol} 成交数据失败:`, error);
      throw error;
    }
  }

  // 获取当前价格
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await this.httpClient.get(`/products/${symbol}/ticker`);
      return parseFloat(response.data.price);
    } catch (error) {
      logger.error(`Coinbase获取 ${symbol} 当前价格失败:`, error);
      throw error;
    }
  }
}