import { BaseExchangeService, TradingPair, ExchangeConfig } from './ExchangeService';
import { logger } from '../../utils/logger';

export class BinanceService extends BaseExchangeService {
  constructor(apiKey?: string, apiSecret?: string) {
    const config: ExchangeConfig = {
      name: 'binance',
      displayName: 'Binance',
      apiBaseUrl: 'https://api.binance.com/api/v3',
      apiKey,
      apiSecret,
      rateLimit: 100, // 100ms between requests
      enabled: true,
    };
    super(config);
  }

  async getExchangeInfo(): Promise<any> {
    try {
      const response = await this.httpClient.get('/exchangeInfo');
      return response.data;
    } catch (error) {
      logger.error('Binance获取交易所信息失败:', error);
      throw error;
    }
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    try {
      logger.info('🔄 开始获取Binance交易对数据...');
      
      // 获取交易所信息和24小时行情数据
      const [exchangeInfo, tickerData] = await Promise.all([
        this.getExchangeInfo(),
        this.get24hrTickers()
      ]);

      const symbols = exchangeInfo.symbols || [];
      const tickers = tickerData || [];

      // 创建交易对映射
      const tickerMap = new Map();
      tickers.forEach((ticker: any) => {
        tickerMap.set(ticker.symbol, ticker);
      });

      // 过滤出正在交易的交易对
      const tradingPairs = symbols
        .filter((symbol: any) => symbol.status === 'TRADING')
        .map((symbol: any) => {
          const ticker = tickerMap.get(symbol.symbol);
          const filters = symbol.filters || [];
          
          // 提取交易规则
          const lotSizeFilter = filters.find((f: any) => f.filterType === 'LOT_SIZE');
          const minNotionalFilter = filters.find((f: any) => f.filterType === 'MIN_NOTIONAL');

          return this.normalizeTradingPair({
            symbol: symbol.symbol,
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
            status: symbol.status,
            price: ticker?.lastPrice || '0',
            volume24h: ticker?.quoteVolume || '0',
            high24h: ticker?.highPrice || '0',
            low24h: ticker?.lowPrice || '0',
            change24h: ticker?.priceChange || '0',
            changePercent24h: ticker?.priceChangePercent || '0',
            bidPrice: ticker?.bidPrice,
            askPrice: ticker?.askPrice,
            bidQuantity: ticker?.bidQty,
            askQuantity: ticker?.askQty,
            minQty: lotSizeFilter?.minQty,
            maxQty: lotSizeFilter?.maxQty,
            stepSize: lotSizeFilter?.stepSize,
            minNotional: minNotionalFilter?.minNotional,
          });
        });

      logger.info(`✅ 成功获取 ${tradingPairs.length} 个Binance交易对数据`);
      return tradingPairs;
    } catch (error) {
      logger.error('Binance获取交易对数据失败:', error);
      throw error;
    }
  }

  async getTradingPair(symbol: string): Promise<TradingPair | null> {
    try {
      const [exchangeInfo, ticker] = await Promise.all([
        this.getExchangeInfo(),
        this.get24hrTicker(symbol)
      ]);

      const symbolInfo = exchangeInfo.symbols?.find((s: any) => s.symbol === symbol);
      if (!symbolInfo) {
        return null;
      }

      const filters = symbolInfo.filters || [];
      const lotSizeFilter = filters.find((f: any) => f.filterType === 'LOT_SIZE');
      const minNotionalFilter = filters.find((f: any) => f.filterType === 'MIN_NOTIONAL');

      return this.normalizeTradingPair({
        symbol: symbolInfo.symbol,
        baseAsset: symbolInfo.baseAsset,
        quoteAsset: symbolInfo.quoteAsset,
        status: symbolInfo.status,
        price: ticker?.lastPrice || '0',
        volume24h: ticker?.quoteVolume || '0',
        high24h: ticker?.highPrice || '0',
        low24h: ticker?.lowPrice || '0',
        change24h: ticker?.priceChange || '0',
        changePercent24h: ticker?.priceChangePercent || '0',
        bidPrice: ticker?.bidPrice,
        askPrice: ticker?.askPrice,
        bidQuantity: ticker?.bidQty,
        askQuantity: ticker?.askQty,
        minQty: lotSizeFilter?.minQty,
        maxQty: lotSizeFilter?.maxQty,
        stepSize: lotSizeFilter?.stepSize,
        minNotional: minNotionalFilter?.minNotional,
      });
    } catch (error) {
      logger.error(`Binance获取交易对 ${symbol} 数据失败:`, error);
      return null;
    }
  }

  async getTickerData(symbol: string): Promise<any> {
    try {
      const response = await this.httpClient.get('/ticker/24hr', {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      logger.error(`Binance获取 ${symbol} 行情数据失败:`, error);
      throw error;
    }
  }

  async get24hrTicker(symbol: string): Promise<any> {
    return this.getTickerData(symbol);
  }

  async get24hrTickers(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/ticker/24hr');
      return response.data;
    } catch (error) {
      logger.error('Binance获取24小时行情数据失败:', error);
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    try {
      const response = await this.httpClient.get('/depth', {
        params: { symbol, limit }
      });
      return response.data;
    } catch (error) {
      logger.error(`Binance获取 ${symbol} 订单簿失败:`, error);
      throw error;
    }
  }

  // 获取K线数据
  async getKlines(symbol: string, interval: string = '1h', limit: number = 500): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/klines', {
        params: { symbol, interval, limit }
      });
      return response.data;
    } catch (error) {
      logger.error(`Binance获取 ${symbol} K线数据失败:`, error);
      throw error;
    }
  }

  // 获取最新价格
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await this.httpClient.get('/ticker/price', {
        params: { symbol }
      });
      return parseFloat(response.data.price);
    } catch (error) {
      logger.error(`Binance获取 ${symbol} 价格失败:`, error);
      throw error;
    }
  }

  // 获取所有交易对的最新价格
  async getAllPrices(): Promise<Map<string, number>> {
    try {
      const response = await this.httpClient.get('/ticker/price');
      const prices = new Map<string, number>();
      
      response.data.forEach((item: any) => {
        prices.set(item.symbol, parseFloat(item.price));
      });
      
      return prices;
    } catch (error) {
      logger.error('Binance获取所有价格失败:', error);
      throw error;
    }
  }
}