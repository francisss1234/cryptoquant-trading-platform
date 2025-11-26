import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchange: string;
  price: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  bidPrice?: number;
  askPrice?: number;
  bidQuantity?: number;
  askQuantity?: number;
  lastUpdated: Date;
  status: 'TRADING' | 'BREAK' | 'HALT';
  minQty?: number;
  maxQty?: number;
  stepSize?: number;
  minNotional?: number;
}

export interface ExchangeConfig {
  name: string;
  displayName: string;
  apiBaseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  rateLimit: number;
  enabled: boolean;
}

export abstract class BaseExchangeService {
  protected httpClient: AxiosInstance;
  protected config: ExchangeConfig;
  protected lastRequestTime: number = 0;

  constructor(config: ExchangeConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'CryptoQuant/1.0',
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器 - 速率限制
    this.httpClient.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.config.rateLimit) {
        const waitTime = this.config.rateLimit - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });

    // 响应拦截器 - 错误处理
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`${this.config.name} API错误:`, error.message);
        throw this.handleError(error);
      }
    );
  }

  protected handleError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(`${this.config.name} API错误 ${status}: ${data?.msg || data?.message || '未知错误'}`);
    } else if (error.request) {
      return new Error(`${this.config.name} 网络连接失败`);
    } else {
      return new Error(`${this.config.name} 请求配置错误: ${error.message}`);
    }
  }

  abstract getTradingPairs(): Promise<TradingPair[]>;
  abstract getTradingPair(symbol: string): Promise<TradingPair | null>;
  abstract getExchangeInfo(): Promise<any>;
  abstract getTickerData(symbol: string): Promise<any>;
  abstract getOrderBook(symbol: string, limit?: number): Promise<any>;
  abstract get24hrTicker(symbol: string): Promise<any>;
  
  // 验证交易对数据完整性
  protected validateTradingPair(data: any): boolean {
    const requiredFields = ['symbol', 'baseAsset', 'quoteAsset', 'price', 'volume24h'];
    return requiredFields.every(field => data[field] !== undefined && data[field] !== null);
  }

  // 标准化交易对数据
  protected normalizeTradingPair(data: any): TradingPair {
    return {
      symbol: data.symbol,
      baseAsset: data.baseAsset || data.base_currency || data.base,
      quoteAsset: data.quoteAsset || data.quote_currency || data.quote,
      exchange: this.config.name,
      price: parseFloat(data.price || data.lastPrice || data.close || '0'),
      volume24h: parseFloat(data.volume24h || data.volume || data.quoteVolume || '0'),
      high24h: parseFloat(data.high24h || data.highPrice || '0'),
      low24h: parseFloat(data.low24h || data.lowPrice || '0'),
      change24h: parseFloat(data.change24h || data.priceChange || '0'),
      changePercent24h: parseFloat(data.changePercent24h || data.priceChangePercent || '0'),
      bidPrice: data.bidPrice ? parseFloat(data.bidPrice) : undefined,
      askPrice: data.askPrice ? parseFloat(data.askPrice) : undefined,
      bidQuantity: data.bidQty ? parseFloat(data.bidQty) : undefined,
      askQuantity: data.askQty ? parseFloat(data.askQty) : undefined,
      lastUpdated: new Date(),
      status: data.status || 'TRADING',
      minQty: data.minQty ? parseFloat(data.minQty) : undefined,
      maxQty: data.maxQty ? parseFloat(data.maxQty) : undefined,
      stepSize: data.stepSize ? parseFloat(data.stepSize) : undefined,
      minNotional: data.minNotional ? parseFloat(data.minNotional) : undefined,
    };
  }

  // 获取服务状态
  getStatus(): { name: string; enabled: boolean; lastRequestTime: number } {
    return {
      name: this.config.name,
      enabled: this.config.enabled,
      lastRequestTime: this.lastRequestTime,
    };
  }
}