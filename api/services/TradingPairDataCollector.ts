import { ExchangeManager } from './exchange/ExchangeManager';
import { TradingPairStorageService } from './TradingPairStorageService';
import { logger } from '../utils/logger';
import { CronJob } from 'cron';

export interface DataCollectorConfig {
  enabled: boolean;
  updateInterval: string; // cron expression
  batchSize: number;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  cleanupInterval: string; // cron expression for cleanup
  maxDataAge: number; // hours
}

export class TradingPairDataCollector {
  private exchangeManager: ExchangeManager;
  private storageService: TradingPairStorageService;
  private config: DataCollectorConfig;
  private updateJob: CronJob | null = null;
  private cleanupJob: CronJob | null = null;
  private isRunning: boolean = false;
  private stats = {
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastUpdateTime: null as Date | null,
    lastUpdateCount: 0,
    averageUpdateTime: 0,
    errors: [] as string[]
  };

  constructor(
    exchangeManager: ExchangeManager,
    storageService: TradingPairStorageService,
    config: Partial<DataCollectorConfig> = {}
  ) {
    this.exchangeManager = exchangeManager;
    this.storageService = storageService;
    
    this.config = {
      enabled: true,
      updateInterval: '*/5 * * * *', // 每5分钟更新一次
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000, // 5秒
      cleanupInterval: '0 2 * * *', // 每天凌晨2点清理
      maxDataAge: 24, // 24小时
      ...config
    };
  }

  // 启动数据收集器
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ 数据收集器已经在运行中');
      return;
    }

    if (!this.config.enabled) {
      logger.info('📊 数据收集器已禁用');
      return;
    }

    try {
      logger.info('🚀 启动交易对数据收集器...');
      
      // 初始化存储服务
      await this.storageService.initializeTable();
      
      // 创建定时更新任务
      this.updateJob = new CronJob(
        this.config.updateInterval,
        () => this.performUpdate(),
        null,
        true, // 立即启动
        'UTC'
      );

      // 创建清理任务
      this.cleanupJob = new CronJob(
        this.config.cleanupInterval,
        () => this.performCleanup(),
        null,
        true,
        'UTC'
      );

      this.isRunning = true;
      logger.info(`✅ 数据收集器已启动`);
      logger.info(`📅 更新间隔: ${this.config.updateInterval}`);
      logger.info(`🧹 清理间隔: ${this.config.cleanupInterval}`);

      // 立即执行一次更新
      await this.performUpdate();
      
    } catch (error) {
      logger.error('❌ 启动数据收集器失败:', error);
      throw error;
    }
  }

  // 停止数据收集器
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('⚠️ 数据收集器未运行');
      return;
    }

    try {
      logger.info('🛑 停止交易对数据收集器...');
      
      if (this.updateJob) {
        this.updateJob.stop();
        this.updateJob = null;
      }

      if (this.cleanupJob) {
        this.cleanupJob.stop();
        this.cleanupJob = null;
      }

      this.isRunning = false;
      logger.info('✅ 数据收集器已停止');
      
    } catch (error) {
      logger.error('❌ 停止数据收集器失败:', error);
      throw error;
    }
  }

  // 执行数据更新
  private async performUpdate(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('🔄 开始更新交易对数据...');
      this.stats.totalUpdates++;

      // 获取所有交易对数据
      const allPairs = await this.exchangeManager.getAllTradingPairs();
      
      if (allPairs.length === 0) {
        logger.warn('⚠️ 未获取到任何交易对数据');
        this.stats.failedUpdates++;
        return;
      }

      logger.info(`📊 获取到 ${allPairs.length} 个交易对数据`);

      // 数据验证和去重
      const validPairs = await this.storageService.validateAndDeduplicate(allPairs);
      
      if (validPairs.length === 0) {
        logger.warn('⚠️ 没有有效的交易对数据');
        this.stats.failedUpdates++;
        return;
      }

      // 批量存储数据
      const storedCount = await this.storageService.upsertTradingPairs(validPairs);
      
      const endTime = Date.now();
      const updateTime = endTime - startTime;
      
      // 更新统计信息
      this.stats.successfulUpdates++;
      this.stats.lastUpdateTime = new Date();
      this.stats.lastUpdateCount = storedCount;
      this.stats.averageUpdateTime = (this.stats.averageUpdateTime * (this.stats.successfulUpdates - 1) + updateTime) / this.stats.successfulUpdates;

      logger.info(`✅ 数据更新完成: ${storedCount}/${validPairs.length} 个交易对, 耗时 ${updateTime}ms`);
      
    } catch (error) {
      this.stats.failedUpdates++;
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.stats.errors.push(errorMessage);
      
      // 保持错误记录数量在合理范围内
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-50);
      }

      logger.error('❌ 数据更新失败:', error);
      
      // 重试机制
      if (this.stats.failedUpdates <= this.config.retryAttempts) {
        logger.info(`🔄 将在 ${this.config.retryDelay}ms 后重试 (${this.stats.failedUpdates}/${this.config.retryAttempts})`);
        setTimeout(() => this.performUpdate(), this.config.retryDelay);
      }
    }
  }

  // 执行数据清理
  private async performCleanup(): Promise<void> {
    try {
      logger.info('🧹 开始清理过期交易对数据...');
      
      const deletedCount = await this.storageService.cleanupExpiredData(this.config.maxDataAge);
      
      logger.info(`✅ 清理完成: 删除了 ${deletedCount} 个过期交易对数据`);
      
    } catch (error) {
      logger.error('❌ 清理过期数据失败:', error);
    }
  }

  // 手动触发更新
  async manualUpdate(): Promise<{ success: boolean; count: number; duration: number }> {
    const startTime = Date.now();
    
    try {
      logger.info('👆 手动触发交易对数据更新...');
      
      // 获取所有交易对数据
      const allPairs = await this.exchangeManager.getAllTradingPairs();
      
      if (allPairs.length === 0) {
        return { success: false, count: 0, duration: Date.now() - startTime };
      }

      // 数据验证和去重
      const validPairs = await this.storageService.validateAndDeduplicate(allPairs);
      
      if (validPairs.length === 0) {
        return { success: false, count: 0, duration: Date.now() - startTime };
      }

      // 批量存储数据
      const storedCount = await this.storageService.upsertTradingPairs(validPairs);
      
      const duration = Date.now() - startTime;
      
      logger.info(`✅ 手动更新完成: ${storedCount} 个交易对, 耗时 ${duration}ms`);
      
      return { success: true, count: storedCount, duration };
      
    } catch (error) {
      logger.error('❌ 手动更新失败:', error);
      const duration = Date.now() - startTime;
      return { success: false, count: 0, duration };
    }
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      config: {
        updateInterval: this.config.updateInterval,
        batchSize: this.config.batchSize,
        maxDataAge: this.config.maxDataAge
      }
    };
  }

  // 获取运行状态
  getStatus(): { running: boolean; lastUpdate?: Date; nextUpdate?: Date } {
    const status: any = {
      running: this.isRunning,
      lastUpdate: this.stats.lastUpdateTime
    };

    if (this.updateJob && this.isRunning) {
      status.nextUpdate = this.updateJob.nextDate().toDate();
    }

    return status;
  }

  // 获取健康状态
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const exchangeHealth = await this.exchangeManager.healthCheck();
    const lastUpdateTime = this.stats.lastUpdateTime;
    const now = new Date();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const details: any = {
      running: this.isRunning,
      lastUpdateTime,
      exchangeHealth: Object.fromEntries(exchangeHealth),
      stats: this.getStats()
    };

    // 检查最后更新时间
    if (lastUpdateTime) {
      const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();
      const minutesSinceLastUpdate = timeSinceLastUpdate / (1000 * 60);
      
      if (minutesSinceLastUpdate > 30) {
        status = 'unhealthy';
        details.lastUpdateStatus = 'overdue';
      } else if (minutesSinceLastUpdate > 15) {
        status = 'degraded';
        details.lastUpdateStatus = 'delayed';
      } else {
        details.lastUpdateStatus = 'recent';
      }
    } else {
      status = 'unhealthy';
      details.lastUpdateStatus = 'never';
    }

    // 检查交易所健康状态
    const healthyExchanges = Array.from(exchangeHealth.values()).filter(h => h).length;
    const totalExchanges = exchangeHealth.size;
    
    if (healthyExchanges === 0) {
      status = 'unhealthy';
      details.exchangeStatus = 'all_down';
    } else if (healthyExchanges < totalExchanges) {
      status = 'degraded';
      details.exchangeStatus = 'partial';
    } else {
      details.exchangeStatus = 'all_healthy';
    }

    details.overallHealth = {
      status,
      healthyExchanges,
      totalExchanges,
      lastUpdateMinutesAgo: lastUpdateTime ? Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60)) : null
    };

    return { status, details };
  }

  // 重置统计信息
  resetStats(): void {
    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastUpdateTime: null,
      lastUpdateCount: 0,
      averageUpdateTime: 0,
      errors: []
    };
    
    logger.info('📊 统计信息已重置');
  }
}