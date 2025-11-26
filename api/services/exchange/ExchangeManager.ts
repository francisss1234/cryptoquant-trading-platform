import { BinanceService } from './BinanceService';
import { CoinbaseService } from './CoinbaseService';
import { OKXService } from './OKXService';
import { TradingPair, BaseExchangeService, ExchangeConfig } from './ExchangeService';
import { logger } from '../../utils/logger';

export interface ExchangeService {
  name: string;
  service: BaseExchangeService;
  enabled: boolean;
}

export class ExchangeManager {
  private services: Map<string, ExchangeService> = new Map();
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
    this.initializeServices();
  }

  private initializeServices(): void {
    logger.info('🚀 初始化交易所服务管理器...');

    // Binance服务
    if (this.config.binance?.enabled !== false) {
      const binanceService = new BinanceService(
        this.config.binance?.apiKey,
        this.config.binance?.apiSecret
      );
      this.services.set('binance', {
        name: 'binance',
        service: binanceService,
        enabled: true
      });
      logger.info('✅ Binance服务已初始化');
    }

    // Coinbase服务
    if (this.config.coinbase?.enabled !== false) {
      const coinbaseService = new CoinbaseService(
        this.config.coinbase?.apiKey,
        this.config.coinbase?.apiSecret
      );
      this.services.set('coinbase', {
        name: 'coinbase',
        service: coinbaseService,
        enabled: true
      });
      logger.info('✅ Coinbase服务已初始化');
    }

    // OKX服务
    if (this.config.okx?.enabled !== false) {
      const okxService = new OKXService(
        this.config.okx?.apiKey,
        this.config.okx?.apiSecret,
        this.config.okx?.password
      );
      this.services.set('okx', {
        name: 'okx',
        service: okxService,
        enabled: true
      });
      logger.info('✅ OKX服务已初始化');
    }

    logger.info(`📊 已初始化 ${this.services.size} 个交易所服务`);
  }

  // 获取所有启用的交易所服务
  getEnabledServices(): ExchangeService[] {
    return Array.from(this.services.values()).filter(service => service.enabled);
  }

  // 获取指定交易所服务
  getService(exchangeName: string): ExchangeService | undefined {
    return this.services.get(exchangeName.toLowerCase());
  }

  // 获取所有交易对（并行获取所有交易所）
  async getAllTradingPairs(): Promise<TradingPair[]> {
    const enabledServices = this.getEnabledServices();
    logger.info(`🔄 开始从 ${enabledServices.length} 个交易所获取交易对数据...`);

    try {
      const results = await Promise.allSettled(
        enabledServices.map(async (exchangeService) => {
          try {
            const pairs = await exchangeService.service.getTradingPairs();
            logger.info(`✅ ${exchangeService.name} 获取到 ${pairs.length} 个交易对`);
            return pairs;
          } catch (error) {
            logger.error(`${exchangeService.name} 获取交易对失败:`, error);
            return [];
          }
        })
      );

      const allPairs: TradingPair[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allPairs.push(...result.value);
        } else {
          logger.error(`${enabledServices[index].name} 获取交易对异常:`, result.reason);
        }
      });

      logger.info(`✅ 总计获取到 ${allPairs.length} 个交易对`);
      return allPairs;
    } catch (error) {
      logger.error('获取所有交易对失败:', error);
      throw error;
    }
  }

  // 获取指定交易对（从所有交易所查找）
  async getTradingPair(symbol: string): Promise<TradingPair | null> {
    const enabledServices = this.getEnabledServices();
    
    for (const exchangeService of enabledServices) {
      try {
        const pair = await exchangeService.service.getTradingPair(symbol);
        if (pair) {
          logger.info(`✅ 在 ${exchangeService.name} 找到交易对 ${symbol}`);
          return pair;
        }
      } catch (error) {
        logger.warn(`${exchangeService.name} 获取交易对 ${symbol} 失败:`, error);
      }
    }

    logger.warn(`⚠️ 未找到交易对 ${symbol}`);
    return null;
  }

  // 获取指定交易所的交易对
  async getExchangeTradingPairs(exchangeName: string): Promise<TradingPair[]> {
    const exchangeService = this.getService(exchangeName);
    if (!exchangeService || !exchangeService.enabled) {
      logger.warn(`⚠️ 交易所 ${exchangeName} 未启用或不存在`);
      return [];
    }

    try {
      const pairs = await exchangeService.service.getTradingPairs();
      logger.info(`✅ ${exchangeName} 获取到 ${pairs.length} 个交易对`);
      return pairs;
    } catch (error) {
      logger.error(`${exchangeName} 获取交易对失败:`, error);
      return [];
    }
  }

  // 获取交易所状态
  getExchangeStatus(): Array<{ name: string; enabled: boolean; status: string; lastUpdate?: Date }> {
    const status = [];
    
    for (const [name, service] of this.services) {
      status.push({
        name,
        enabled: service.enabled,
        status: service.enabled ? 'active' : 'disabled',
        lastUpdate: new Date()
      });
    }

    return status;
  }

  // 启用/禁用交易所
  setExchangeEnabled(exchangeName: string, enabled: boolean): boolean {
    const service = this.services.get(exchangeName.toLowerCase());
    if (service) {
      service.enabled = enabled;
      logger.info(`🔧 ${exchangeName} 服务已${enabled ? '启用' : '禁用'}`);
      return true;
    }
    
    logger.warn(`⚠️ 未找到交易所 ${exchangeName}`);
    return false;
  }

  // 获取服务统计信息
  getServiceStats(): Map<string, any> {
    const stats = new Map();
    
    for (const [name, service] of this.services) {
      const serviceStats = service.service.getStatus();
      stats.set(name, {
        ...serviceStats,
        enabled: service.enabled
      });
    }

    return stats;
  }

  // 健康检查
  async healthCheck(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();
    
    for (const [name, service] of this.services) {
      if (!service.enabled) {
        health.set(name, false);
        continue;
      }

      try {
        // 尝试获取交易所信息来检查健康状态
        await service.service.getExchangeInfo();
        health.set(name, true);
        logger.info(`✅ ${name} 健康检查通过`);
      } catch (error) {
        health.set(name, false);
        logger.error(`❌ ${name} 健康检查失败:`, error);
      }
    }

    return health;
  }

  // 获取所有交易对的实时价格
  async getAllPrices(): Promise<Map<string, Map<string, number>>> {
    const allPrices = new Map<string, Map<string, number>>();
    
    for (const [name, service] of this.services) {
      if (!service.enabled) continue;

      try {
        // 这里需要根据具体交易所实现获取所有价格的方法
        // 暂时返回空的价格映射
        allPrices.set(name, new Map());
      } catch (error) {
        logger.error(`${name} 获取价格失败:`, error);
        allPrices.set(name, new Map());
      }
    }

    return allPrices;
  }

  // 关闭所有服务
  async shutdown(): Promise<void> {
    logger.info('🛑 正在关闭交易所服务管理器...');
    
    // 这里可以添加清理逻辑，如关闭连接池等
    this.services.clear();
    
    logger.info('✅ 交易所服务管理器已关闭');
  }
}

// 创建单例实例
let exchangeManager: ExchangeManager | null = null;

export function createExchangeManager(config?: any): ExchangeManager {
  if (!exchangeManager) {
    exchangeManager = new ExchangeManager(config);
  }
  return exchangeManager;
}

export function getExchangeManager(): ExchangeManager {
  if (!exchangeManager) {
    throw new Error('交易所管理器未初始化，请先调用 createExchangeManager()');
  }
  return exchangeManager;
}