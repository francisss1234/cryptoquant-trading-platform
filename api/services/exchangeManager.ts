import * as ccxt from 'ccxt';

export interface ExchangeConfig {
  apiKey: string;
  secret: string;
  password?: string;
  enableRateLimit: boolean;
  options?: {
    defaultType?: 'spot' | 'future' | 'margin';
  };
}

export class ExchangeManager {
  private exchanges: Map<string, ccxt.Exchange> = new Map();

  constructor() {
    this.initializeExchanges();
  }

  private initializeExchanges(): void {
    // 预定义支持的交易所
    const supportedExchanges = ['binance', 'coinbase', 'okx', 'kraken', 'bybit'];
    
    for (const exchangeId of supportedExchanges) {
      try {
        const exchangeClass = (ccxt as any)[exchangeId as keyof typeof ccxt];
        if (exchangeClass) {
          // 创建实例但不初始化，等待配置
          this.exchanges.set(exchangeId, new exchangeClass());
        }
      } catch (error) {
        console.warn(`⚠️ 初始化交易所 ${exchangeId} 失败:`, error);
      }
    }
  }

  public configureExchange(exchangeId: string, config: ExchangeConfig): boolean {
    try {
      const exchange = this.exchanges.get(exchangeId);
      if (!exchange) {
        console.error(`❌ 不支持的交易所: ${exchangeId}`);
        return false;
      }

      // 重新创建带配置的实例
      const exchangeClass = (ccxt as any)[exchangeId as keyof typeof ccxt];
      const configuredExchange = new exchangeClass(config);
      
      this.exchanges.set(exchangeId, configuredExchange);
      console.log(`✅ 交易所 ${exchangeId} 配置成功`);
      return true;
    } catch (error) {
      console.error(`❌ 配置交易所 ${exchangeId} 失败:`, error);
      return false;
    }
  }

  public getExchange(exchangeId: string): any | undefined {
    return this.exchanges.get(exchangeId);
  }

  public async fetchTicker(exchangeId: string, symbol: string): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) {
      throw new Error(`交易所 ${exchangeId} 未找到或未配置`);
    }

    try {
      return await exchange.fetchTicker(symbol);
    } catch (error) {
      console.error(`❌ 获取 ${symbol} 行情数据失败:`, error);
      throw error;
    }
  }

  public async fetchOHLCV(
    exchangeId: string, 
    symbol: string, 
    timeframe: string = '1h',
    since?: number,
    limit?: number
  ): Promise<any[]> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) {
      throw new Error(`交易所 ${exchangeId} 未找到或未配置`);
    }

    try {
      return await exchange.fetchOHLCV(symbol, timeframe, since, limit);
    } catch (error) {
      console.error(`❌ 获取 ${symbol} K线数据失败:`, error);
      throw error;
    }
  }

  public async fetchOrderBook(exchangeId: string, symbol: string, limit?: number): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) {
      throw new Error(`交易所 ${exchangeId} 未找到或未配置`);
    }

    try {
      return await exchange.fetchOrderBook(symbol, limit);
    } catch (error) {
      console.error(`❌ 获取 ${symbol} 订单簿数据失败:`, error);
      throw error;
    }
  }

  public async fetchTrades(exchangeId: string, symbol: string, since?: number, limit?: number): Promise<any[]> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) {
      throw new Error(`交易所 ${exchangeId} 未找到或未配置`);
    }

    try {
      return await exchange.fetchTrades(symbol, since, limit);
    } catch (error) {
      console.error(`❌ 获取 ${symbol} 成交数据失败:`, error);
      throw error;
    }
  }

  public async createOrder(
    exchangeId: string,
    symbol: string,
    type: 'market' | 'limit' | 'stop_loss' | 'take_profit',
    side: 'buy' | 'sell',
    amount: number,
    price?: number,
    params?: any
  ): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) {
      throw new Error(`交易所 ${exchangeId} 未找到或未配置`);
    }

    try {
      return await exchange.createOrder(symbol, type, side, amount, price, params);
    } catch (error) {
      console.error(`❌ 创建订单失败:`, error);
      throw error;
    }
  }

  public async fetchBalance(exchangeId: string): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) {
      throw new Error(`交易所 ${exchangeId} 未找到或未配置`);
    }

    try {
      return await exchange.fetchBalance();
    } catch (error) {
      console.error(`❌ 获取账户余额失败:`, error);
      throw error;
    }
  }

  public getSupportedExchanges(): string[] {
    return Array.from(this.exchanges.keys());
  }

  public isExchangeConfigured(exchangeId: string): boolean {
    const exchange = this.getExchange(exchangeId);
    return exchange !== undefined && exchange.apiKey !== undefined;
  }
}

// 创建单例实例
export const exchangeManager = new ExchangeManager();