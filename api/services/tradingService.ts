import { ExchangeManager } from './exchangeManager.js';
import { DatabaseConnection } from '../config/database.js';
import { StrategyService } from './strategyService.js';

export interface Order {
  id?: string;
  exchange_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  quantity: number;
  price?: number;
  stop_price?: number;
  status: 'pending' | 'open' | 'closed' | 'cancelled' | 'rejected';
  filled_quantity: number;
  average_price?: number;
  fees: number;
  created_at: Date;
  updated_at: Date;
  strategy_id?: string;
  signal_id?: string;
}

export interface Position {
  id?: string;
  exchange_id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  created_at: Date;
  updated_at: Date;
  strategy_id?: string;
}

export interface TradeExecution {
  id?: string;
  order_id: string;
  exchange_trade_id: string;
  quantity: number;
  price: number;
  fees: number;
  timestamp: Date;
}

export interface TradingConfig {
  max_positions: number;
  max_position_size: number;
  max_daily_trades: number;
  max_slippage: number;
  enable_auto_trading: boolean;
  enable_paper_trading: boolean;
}

export class TradingService {
  private exchangeManager: ExchangeManager;
  private db: DatabaseConnection;
  private strategyService: StrategyService;
  private tradingConfig: TradingConfig;
  private activePositions: Map<string, Position> = new Map();
  private pendingOrders: Map<string, Order> = new Map();

  constructor() {
    this.exchangeManager = new ExchangeManager();
    this.db = new DatabaseConnection();
    this.strategyService = new StrategyService();
    this.tradingConfig = {
      max_positions: 10,
      max_position_size: 1000,
      max_daily_trades: 50,
      max_slippage: 0.01,
      enable_auto_trading: false,
      enable_paper_trading: true
    };
  }

  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'filled_quantity' | 'fees'>): Promise<Order> {
    const order: Order = {
      ...orderData,
      id: this.generateId(),
      filled_quantity: 0,
      fees: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    // 验证订单参数
    const validation = await this.validateOrder(order);
    if (!validation.valid) {
      order.status = 'rejected';
      order.updated_at = new Date();
      await this.saveOrder(order);
      throw new Error(`订单验证失败: ${validation.reason}`);
    }

    // 检查交易限制
    const limitsCheck = await this.checkTradingLimits(order);
    if (!limitsCheck.valid) {
      order.status = 'rejected';
      order.updated_at = new Date();
      await this.saveOrder(order);
      throw new Error(`交易限制检查失败: ${limitsCheck.reason}`);
    }

    try {
      let processedOrder = order;
      if (this.tradingConfig.enable_paper_trading) {
        // 模拟交易模式
        processedOrder.status = 'open';
        processedOrder = await this.simulateOrderExecution(processedOrder);
      } else if (this.tradingConfig.enable_auto_trading) {
        // 真实交易模式
        processedOrder = await this.executeRealOrder(processedOrder);
      } else {
        // 手动交易模式，订单保持pending状态
        processedOrder.status = 'pending';
      }

      await this.saveOrder(processedOrder);
      
      if (processedOrder.status === 'open' || processedOrder.status === 'closed') {
        await this.updatePosition(processedOrder);
      }

      return processedOrder;
    } catch (error) {
      order.status = 'rejected';
      order.updated_at = new Date();
      await this.saveOrder(order);
      throw error;
    }
  }

  private async validateOrder(order: Order): Promise<{ valid: boolean; reason?: string }> {
    // 检查交易所连接
    const exchange = this.exchangeManager.getExchange(order.exchange_id);
    if (!exchange) {
      return { valid: false, reason: '交易所未配置' };
    }

    // 检查交易对是否支持
    const markets = await exchange.loadMarkets();
    if (!markets[order.symbol]) {
      return { valid: false, reason: '不支持的交���对' };
    }

    // 检查订单数量
    if (order.quantity <= 0) {
      return { valid: false, reason: '订单数量必须大于0' };
    }

    // 检查价格（限价单）
    if (order.type === 'limit' && (!order.price || order.price <= 0)) {
      return { valid: false, reason: '限价单必须指定有效价格' };
    }

    // 检查止损价格
    if (order.type === 'stop_loss' && (!order.stop_price || order.stop_price <= 0)) {
      return { valid: false, reason: '止损单必须指定止损价格' };
    }

    return { valid: true };
  }

  private async checkTradingLimits(order: Order): Promise<{ valid: boolean; reason?: string }> {
    // 检查持仓数量限制
    if (this.activePositions.size >= this.tradingConfig.max_positions) {
      return { valid: false, reason: '超过最大持仓数量限制' };
    }

    // 检查仓位大小限制
    if (order.quantity > this.tradingConfig.max_position_size) {
      return { valid: false, reason: '超过最大仓位大小限制' };
    }

    // 检查每日交易次数限制
    const todayTrades = await this.getTodayTradesCount();
    if (todayTrades >= this.tradingConfig.max_daily_trades) {
      return { valid: false, reason: '超过每日最大交易次数限制' };
    }

    return { valid: true };
  }

  private async simulateOrderExecution(order: Order): Promise<Order> {
    // 模拟订单执行
    const marketPrice = await this.getCurrentMarketPrice(order.exchange_id, order.symbol);
    
    let executionPrice: number;
    let filledQuantity: number;

    switch (order.type) {
      case 'market':
        executionPrice = marketPrice * (1 + (Math.random() - 0.5) * this.tradingConfig.max_slippage);
        filledQuantity = order.quantity;
        break;
      
      case 'limit':
        if (order.side === 'buy' && order.price! >= marketPrice) {
          executionPrice = order.price!;
          filledQuantity = order.quantity;
        } else if (order.side === 'sell' && order.price! <= marketPrice) {
          executionPrice = order.price!;
          filledQuantity = order.quantity;
        } else {
          // 限价单未成交，保持open状态
          return order;
        }
        break;
      
      case 'stop_loss':
        if ((order.side === 'buy' && marketPrice >= order.stop_price!) ||
            (order.side === 'sell' && marketPrice <= order.stop_price!)) {
          executionPrice = marketPrice;
          filledQuantity = order.quantity;
        } else {
          // 止损单未触发，保持open状态
          return order;
        }
        break;
      
      default:
        executionPrice = marketPrice;
        filledQuantity = order.quantity;
    }

    // 计算费用（模拟0.1%的手续费）
    const fees = executionPrice * filledQuantity * 0.001;

    order.filled_quantity = filledQuantity;
    order.average_price = executionPrice;
    order.fees = fees;
    order.status = 'closed';
    order.updated_at = new Date();

    // 记录交易执行
    const execution: TradeExecution = {
      id: this.generateId(),
      order_id: order.id!,
      exchange_trade_id: `sim_${Date.now()}`,
      quantity: filledQuantity,
      price: executionPrice,
      fees: fees,
      timestamp: new Date()
    };

    await this.saveTradeExecution(execution);

    return order;
  }

  private async executeRealOrder(order: Order): Promise<Order> {
    // 真实订单执行（使用CCXT）
    const exchange = this.exchangeManager.getExchange(order.exchange_id);
    if (!exchange) {
      throw new Error('交易所未配置');
    }

    try {
      let ccxtOrder;
      
      switch (order.type) {
        case 'market':
          ccxtOrder = await exchange.createMarketOrder(order.symbol, order.side, order.quantity);
          break;
        case 'limit':
          ccxtOrder = await exchange.createLimitOrder(order.symbol, order.side, order.quantity, order.price);
          break;
        case 'stop_loss':
          ccxtOrder = await exchange.createStopLossOrder(order.symbol, order.side, order.quantity, order.stop_price);
          break;
        default:
          throw new Error(`不支持的订单类型: ${order.type}`);
      }

      // 更新订单状态
      order.status = ccxtOrder.status === 'closed' ? 'closed' : 'open';
      order.filled_quantity = ccxtOrder.filled;
      order.average_price = ccxtOrder.average;
      order.fees = ccxtOrder.fee ? ccxtOrder.fee.cost : 0;
      order.updated_at = new Date();

      // 记录交易执行
      if (ccxtOrder.trades && ccxtOrder.trades.length > 0) {
        for (const trade of ccxtOrder.trades) {
          const execution: TradeExecution = {
            id: this.generateId(),
            order_id: order.id!,
            exchange_trade_id: trade.id,
            quantity: trade.amount,
            price: trade.price,
            fees: trade.fee ? trade.fee.cost : 0,
            timestamp: new Date(trade.timestamp)
          };
          await this.saveTradeExecution(execution);
        }
      }

      return order;
    } catch (error) {
      console.error('真实订单执行失败:', error);
      throw new Error(`订单执行失败: ${error.message}`);
    }
  }

  private async updatePosition(order: Order): Promise<void> {
    const positionKey = `${order.exchange_id}_${order.symbol}`;
    const currentPosition = this.activePositions.get(positionKey);

    if (order.side === 'buy') {
      if (currentPosition) {
        // 增加多头仓位
        const totalQuantity = currentPosition.quantity + order.filled_quantity;
        const totalCost = currentPosition.quantity * currentPosition.entry_price + order.filled_quantity * order.average_price!;
        currentPosition.entry_price = totalCost / totalQuantity;
        currentPosition.quantity = totalQuantity;
      } else {
        // 新建多头仓位
        const newPosition: Position = {
          id: this.generateId(),
          exchange_id: order.exchange_id,
          symbol: order.symbol,
          side: 'long',
          quantity: order.filled_quantity,
          entry_price: order.average_price!,
          current_price: order.average_price!,
          unrealized_pnl: 0,
          realized_pnl: 0,
          created_at: new Date(),
          updated_at: new Date(),
          strategy_id: order.strategy_id
        };
        this.activePositions.set(positionKey, newPosition);
      }
    } else if (order.side === 'sell') {
      if (currentPosition) {
        // 减少仓位或平仓
        if (currentPosition.quantity > order.filled_quantity) {
          // 部分平仓
          const realizedPnl = (order.average_price! - currentPosition.entry_price) * order.filled_quantity;
          currentPosition.quantity -= order.filled_quantity;
          currentPosition.realized_pnl += realizedPnl;
        } else {
          // 完全平仓
          const realizedPnl = (order.average_price! - currentPosition.entry_price) * currentPosition.quantity;
          currentPosition.realized_pnl += realizedPnl;
          this.activePositions.delete(positionKey);
        }
      } else {
        // 新建空头仓位
        const newPosition: Position = {
          id: this.generateId(),
          exchange_id: order.exchange_id,
          symbol: order.symbol,
          side: 'short',
          quantity: order.filled_quantity,
          entry_price: order.average_price!,
          current_price: order.average_price!,
          unrealized_pnl: 0,
          realized_pnl: 0,
          created_at: new Date(),
          updated_at: new Date(),
          strategy_id: order.strategy_id
        };
        this.activePositions.set(positionKey, newPosition);
      }
    }

    // 更新数据库中的仓位信息
    await this.updatePositionsInDatabase();
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.activePositions.values());
  }

  async getOrders(status?: string): Promise<Order[]> {
    let query = 'SELECT * FROM orders';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'open' && order.status !== 'pending') {
      throw new Error('订单状态不允许取消');
    }

    try {
      if (this.tradingConfig.enable_auto_trading && !this.tradingConfig.enable_paper_trading) {
        const exchange = this.exchangeManager.getExchange(order.exchange_id);
        if (exchange) {
          await exchange.cancelOrder(orderId);
        }
      }

      order.status = 'cancelled';
      order.updated_at = new Date();
      await this.saveOrder(order);

      return true;
    } catch (error) {
      console.error('取消订单失败:', error);
      throw new Error(`取消订单失败: ${error.message}`);
    }
  }

  private async getOrder(orderId: string): Promise<Order | null> {
    const result = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private async getCurrentMarketPrice(exchangeId: string, symbol: string): Promise<number> {
    try {
      const ticker = await this.exchangeManager.fetchTicker(exchangeId, symbol);
      return ticker.last || ticker.ask || ticker.bid || 0;
    } catch (error) {
      console.error('获取市场价格失败:', error);
      return 0;
    }
  }

  private async getTodayTradesCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await this.db.query(
      'SELECT COUNT(*) as count FROM orders WHERE created_at >= $1 AND status IN ($2, $3)',
      [today, 'open', 'closed']
    );
    
    return parseInt(result.rows[0].count) || 0;
  }

  private async saveOrder(order: Order): Promise<void> {
    if (order.id) {
      await this.db.query(
        `UPDATE orders SET 
         exchange_id = $1, symbol = $2, side = $3, type = $4, quantity = $5, 
         price = $6, stop_price = $7, status = $8, filled_quantity = $9, 
         average_price = $10, fees = $11, updated_at = $12, strategy_id = $13, signal_id = $14
         WHERE id = $15`,
        [
          order.exchange_id, order.symbol, order.side, order.type, order.quantity,
          order.price, order.stop_price, order.status, order.filled_quantity,
          order.average_price, order.fees, order.updated_at, order.strategy_id,
          order.signal_id, order.id
        ]
      );
    } else {
      await this.db.query(
        `INSERT INTO orders (id, exchange_id, symbol, side, type, quantity, price, 
         stop_price, status, filled_quantity, average_price, fees, created_at, 
         updated_at, strategy_id, signal_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          order.id, order.exchange_id, order.symbol, order.side, order.type,
          order.quantity, order.price, order.stop_price, order.status,
          order.filled_quantity, order.average_price, order.fees,
          order.created_at, order.updated_at, order.strategy_id, order.signal_id
        ]
      );
    }
  }

  private async saveTradeExecution(execution: TradeExecution): Promise<void> {
    await this.db.query(
      `INSERT INTO trade_executions (id, order_id, exchange_trade_id, quantity, 
       price, fees, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        execution.id, execution.order_id, execution.exchange_trade_id,
        execution.quantity, execution.price, execution.fees, execution.timestamp
      ]
    );
  }

  private async updatePositionsInDatabase(): Promise<void> {
    for (const position of this.activePositions.values()) {
      await this.db.query(
        `INSERT INTO positions (id, exchange_id, symbol, side, quantity, entry_price, 
         current_price, unrealized_pnl, realized_pnl, created_at, updated_at, strategy_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         ON CONFLICT (id) DO UPDATE SET 
         quantity = $5, current_price = $7, unrealized_pnl = $8, realized_pnl = $9, 
         updated_at = $11`,
        [
          position.id, position.exchange_id, position.symbol, position.side,
          position.quantity, position.entry_price, position.current_price,
          position.unrealized_pnl, position.realized_pnl, position.created_at,
          position.updated_at, position.strategy_id
        ]
      );
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // 获取交易统计信息
  async getTradingStats(startDate?: Date, endDate?: Date): Promise<{
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_volume: number;
    total_fees: number;
    average_trade_size: number;
    win_rate: number;
  }> {
    let query = 'SELECT * FROM orders WHERE status = $1';
    const params: any[] = ['closed'];
    
    if (startDate) {
      query += ' AND created_at >= $2';
      params.push(startDate);
    }
    
    if (endDate) {
      query += startDate ? ' AND created_at <= $3' : ' AND created_at <= $2';
      params.push(endDate);
    }

    const result = await this.db.query(query, params);
    const orders = result.rows;

    const total_trades = orders.length;
    let winning_trades = 0;
    let losing_trades = 0;
    let total_volume = 0;
    let total_fees = 0;

    for (const order of orders) {
      if (order.side === 'sell' && order.average_price && order.quantity) {
        // 这里需要更复杂的盈亏计算逻辑
        // 简化处理：假设所有卖单都是盈利的
        winning_trades++;
      }
      
      total_volume += (order.average_price || 0) * order.quantity;
      total_fees += order.fees || 0;
    }

    losing_trades = total_trades - winning_trades;
    const win_rate = total_trades > 0 ? (winning_trades / total_trades) * 100 : 0;
    const average_trade_size = total_trades > 0 ? total_volume / total_trades : 0;

    return {
      total_trades,
      winning_trades,
      losing_trades,
      total_volume,
      total_fees,
      average_trade_size,
      win_rate
    };
  }
}