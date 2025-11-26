import { BaseExchangeService, TradingPair, ExchangeConfig } from './ExchangeService';
import { logger } from '../../utils/logger';

export class OKXService extends BaseExchangeService {
  constructor(apiKey?: string, apiSecret?: string, password?: string) {
    const config: ExchangeConfig = {
      name: 'okx',
      displayName: 'OKX',
      apiBaseUrl: 'https://www.okx.com/api/v5',
      apiKey,
      apiSecret,
      rateLimit: 200, // 5 requests per second = 200ms between requests
      enabled: true,
    };
    super(config);

    // 设置OKX特定的认证头
    if (apiKey) {
      this.httpClient.defaults.headers.common['OK-ACCESS-KEY'] = apiKey;
    }
    if (password) {
      this.httpClient.defaults.headers.common['OK-ACCESS-PASSPHRASE'] = password;
    }
  }

  async getExchangeInfo(): Promise<any> {
    try {
      const [publicInstruments, publicTickers] = await Promise.all([
        this.httpClient.get('/public/instruments', { params: { instType: 'SPOT' } }),
        this.httpClient.get('/market/tickers', { params: { instType: 'SPOT' } })
      ]);

      return {
        instruments: publicInstruments.data,
        tickers: publicTickers.data
      };
    } catch (error) {
      logger.error('OKX获取交易所信息失败:', error);
      throw error;
    }
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    try {
      logger.info('🔄 开始获取OKX交易对数据...');
      
      const [exchangeInfo, tickers24h] = await Promise.all([
        this.getExchangeInfo(),
        this.get24hrTickers()
      ]);

      const instruments = exchangeInfo.instruments?.data || [];
      const tickers = exchangeInfo.tickers?.data || [];
      const stats24h = tickers24h?.data || [];

      // 创建行情数据的映射
      const tickerMap = new Map();
      tickers.forEach((ticker: any) => {
        tickerMap.set(ticker.instId, ticker);
      });

      // 创建24小时统计数据的映射
      const statsMap = new Map();
      stats24h.forEach((stat: any) => {
        statsMap.set(stat.instId, stat);
      });

      // 过滤出现货交易对
      const tradingPairs = instruments
        .filter((instrument: any) => instrument.state === 'live' && instrument.instType === 'SPOT')
        .map((instrument: any) => {
          const ticker = tickerMap.get(instrument.instId);
          const stats = statsMap.get(instrument.instId);
          
          return this.normalizeTradingPair({
            symbol: instrument.instId,
            baseAsset: instrument.baseCcy,
            quoteAsset: instrument.quoteCcy,
            status: instrument.state === 'live' ? 'TRADING' : 'HALT',
            price: ticker?.last || stats?.last || '0',
            volume24h: stats?.volCcy24h || stats?.vol24h || '0',
            high24h: stats?.high24h || '0',
            low24h: stats?.low24h || '0',
            change24h: stats?.chg24h || '0',
            changePercent24h: stats?.chgPct24h || '0',
            bidPrice: ticker?.bidPx,
            askPrice: ticker?.askPx,
            bidQuantity: ticker?.bidSz,
            askQuantity: ticker?.askSz,
            minSz: instrument.minSz,
            maxSz: instrument.maxSz,
            tickSz: instrument.tickSz,
            lotSz: instrument.lotSz,
          });
        });

      logger.info(`✅ 成功获取 ${tradingPairs.length} 个OKX交易对数据`);
      return tradingPairs;
    } catch (error) {
      logger.error('OKX获取交易对数据失败:', error);
      throw error;
    }
  }

  async getTradingPair(symbol: string): Promise<TradingPair | null> {
    try {
      const [instrument, ticker, stats] = await Promise.all([
        this.httpClient.get('/public/instruments', { params: { instType: 'SPOT', instId: symbol } }),
        this.httpClient.get('/market/ticker', { params: { instId: symbol } }),
        this.get24hrTicker(symbol)
      ]);

      const instrumentData = instrument.data?.data?.[0];
      const tickerData = ticker.data?.data?.[0];
      const statsData = stats?.data?.[0];

      if (!instrumentData) {
        return null;
      }

      return this.normalizeTradingPair({
        symbol: instrumentData.instId,
        baseAsset: instrumentData.baseCcy,
        quoteAsset: instrumentData.quoteCcy,
        status: instrumentData.state === 'live' ? 'TRADING' : 'HALT',
        price: tickerData?.last || statsData?.last || '0',
        volume24h: statsData?.volCcy24h || statsData?.vol24h || '0',
        high24h: statsData?.high24h || '0',
        low24h: statsData?.low24h || '0',
        change24h: statsData?.chg24h || '0',
        changePercent24h: statsData?.chgPct24h || '0',
        bidPrice: tickerData?.bidPx,
        askPrice: tickerData?.askPx,
        bidQuantity: tickerData?.bidSz,
        askQuantity: tickerData?.askSz,
        minSz: instrumentData.minSz,
        maxSz: instrumentData.maxSz,
        tickSz: instrumentData.tickSz,
        lotSz: instrumentData.lotSz,
      });
    } catch (error) {
      logger.error(`OKX获取交易对 ${symbol} 数据失败:`, error);
      return null;
    }
  }

  async getTickerData(symbol: string): Promise<any> {
    try {
      const response = await this.httpClient.get('/market/ticker', {
        params: { instId: symbol }
      });
      return response.data;
    } catch (error) {
      logger.error(`OKX获取 ${symbol} 行情数据失败:`, error);
      throw error;
    }
  }

  async get24hrTicker(symbol: string): Promise<any> {
    try {
      const response = await this.httpClient.get('/market/tickers', {
        params: { instType: 'SPOT', instId: symbol }
      });
      return response.data;
    } catch (error) {
      logger.error(`OKX获取 ${symbol} 24小时行情数据失败:`, error);
      throw error;
    }
  }

  async get24hrTickers(): Promise<any> {
    try {
      const response = await this.httpClient.get('/market/tickers', {
        params: { instType: 'SPOT' }
      });
      return response.data;
    } catch (error) {
      logger.error('OKX获取24小时行情数据失败:', error);
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    try {
      const response = await this.httpClient.get('/market/books', {
        params: { 
          instId: symbol,
          sz: Math.min(limit, 400) // OKX最大400条
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`OKX获取 ${symbol} 订单簿失败:`, error);
      throw error;
    }
  }

  // 获取K线数据（OKX称为历史数据）
  async getCandles(symbol: string, bar: string = '1H', limit: number = 100): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/market/candles', {
        params: { 
          instId: symbol,
          bar,
          limit: Math.min(limit, 300) // OKX最大300条
        }
      });
      return response.data?.data || [];
    } catch (error) {
      logger.error(`OKX获取 ${symbol} K线数据失败:`, error);
      throw error;
    }
  }

  // 获取最新成交（OKX称为交易记录）
  async getTrades(symbol: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/market/trades', {
        params: { 
          instId: symbol,
          limit: Math.min(limit, 500) // OKX最大500条
        }
      });
      return response.data?.data || [];
    } catch (error) {
      logger.error(`OKX获取 ${symbol} 成交数据失败:`, error);
      throw error;
    }
  }

  // 获取当前价格（OKX称为最新成交价）
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await this.httpClient.get('/market/ticker', {
        params: { instId: symbol }
      });
      const data = response.data?.data?.[0];
      return data ? parseFloat(data.last) : 0;
    } catch (error) {
      logger.error(`OKX获取 ${symbol} 当前价格失败:`, error);
      throw error;
    }
  }

  // 获取指数价格（OKX特有）
  async getIndexPrice(symbol: string): Promise<number> {
    try {
      const response = await this.httpClient.get('/market/index-tickers', {
        params: { instId: symbol }
      });
      const data = response.data?.data?.[0];
      return data ? parseFloat(data.idxPx) : 0;
    } catch (error) {
      logger.error(`OKX获取 ${symbol} 指数价格失败:`, error);
      throw error;
    }
  }
}