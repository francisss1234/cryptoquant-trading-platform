import { Router } from 'express';
import { TradingService } from '../services/tradingService.js';

const router = Router();
const tradingService = new TradingService();

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const { exchange_id, symbol, side, type, quantity, price, stop_price, strategy_id, signal_id } = req.body;
    
    if (!exchange_id || !symbol || !side || !type || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数: exchange_id, symbol, side, type, quantity' 
      });
    }

    if (type === 'limit' && !price) {
      return res.status(400).json({ 
        success: false, 
        error: '限价单必须指定价格' 
      });
    }

    if (type === 'stop_loss' && !stop_price) {
      return res.status(400).json({ 
        success: false, 
        error: '止损单必须指定止损价格' 
      });
    }

    const order = await tradingService.createOrder({
      exchange_id,
      symbol,
      side,
      type,
      quantity,
      price,
      stop_price,
      strategy_id,
      signal_id,
      status: 'pending'
    });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '创建订单失败' 
    });
  }
});

// 获取订单列表
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await tradingService.getOrders(status as string);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取订单列表失败' 
    });
  }
});

// 取消订单
router.delete('/orders/:id', async (req, res) => {
  try {
    const success = await tradingService.cancelOrder(req.params.id);
    res.json({ 
      success: true, 
      message: '订单已取消' 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '取消订单失败' 
    });
  }
});

// 获取当前持仓
router.get('/positions', async (req, res) => {
  try {
    const positions = await tradingService.getPositions();
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取持仓信息失败' 
    });
  }
});

// 获取交易统计
router.get('/trading-stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (start_date) {
      startDate = new Date(start_date as string);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: '无效的开始日期格式' 
        });
      }
    }
    
    if (end_date) {
      endDate = new Date(end_date as string);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: '无效的结束日期格式' 
        });
      }
    }

    const stats = await tradingService.getTradingStats(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching trading stats:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取交易统计失败' 
    });
  }
});

// 执行策略信号
router.post('/execute-signal', async (req, res) => {
  try {
    const { strategy_id, signal, exchange_id, symbol } = req.body;
    
    if (!strategy_id || !signal || !exchange_id || !symbol) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数: strategy_id, signal, exchange_id, symbol' 
      });
    }

    if (!['BUY', 'SELL'].includes(signal.side)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的信号方向，必须是BUY或SELL' 
      });
    }

    // 根据信号创建订单
    const order = await tradingService.createOrder({
      exchange_id,
      symbol,
      side: signal.side.toLowerCase(),
      type: 'market', // 策略信号通常使用市价单
      quantity: signal.quantity || 0.01, // 默认数量，实际应该从策略配置中获取
      strategy_id,
      signal_id: signal.id,
      status: 'pending'
    });

    res.json({ 
      success: true, 
      message: '信号执行成功',
      data: {
        order_id: order.id,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error executing signal:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '信号执行失败' 
    });
  }
});

// 批量执行策略信号
router.post('/execute-signals', async (req, res) => {
  try {
    const { signals } = req.body;
    
    if (!Array.isArray(signals) || signals.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'signals必须是包含信号对象的数组' 
      });
    }

    const results = [];
    const errors = [];

    for (const signal of signals) {
      try {
        const order = await tradingService.createOrder({
          exchange_id: signal.exchange_id,
          symbol: signal.symbol,
          side: signal.side.toLowerCase(),
          type: signal.order_type || 'market',
          quantity: signal.quantity,
          price: signal.price,
          stop_price: signal.stop_price,
          strategy_id: signal.strategy_id,
          signal_id: signal.id,
          status: 'pending'
        });

        results.push({
          signal_id: signal.id,
          order_id: order.id,
          status: order.status,
          success: true
        });
      } catch (error) {
        errors.push({
          signal_id: signal.id,
          error: error.message,
          success: false
        });
      }
    }

    res.json({ 
      success: true, 
      data: {
        results,
        errors,
        total: signals.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error executing signals:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '批量信号执行失败' 
    });
  }
});

// 获取交易配置
router.get('/config', async (req, res) => {
  try {
    // 返回当前交易配置（实际应该从配置文件或数据库获取）
    const config = {
      max_positions: 10,
      max_position_size: 1000,
      max_daily_trades: 50,
      max_slippage: 0.01,
      enable_auto_trading: false,
      enable_paper_trading: true
    };
    
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching trading config:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取交易配置失败' 
    });
  }
});

// 更新交易配置
router.put('/config', async (req, res) => {
  try {
    const config = req.body;
    
    // 验证配置参数
    if (config.max_positions !== undefined && config.max_positions <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: '最大持仓数量必须大于0' 
      });
    }
    
    if (config.max_position_size !== undefined && config.max_position_size <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: '最大仓位大小必须大于0' 
      });
    }
    
    if (config.max_daily_trades !== undefined && config.max_daily_trades <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: '每日最大交易次数必须大于0' 
      });
    }
    
    if (config.max_slippage !== undefined && (config.max_slippage < 0 || config.max_slippage > 1)) {
      return res.status(400).json({ 
        success: false, 
        error: '最大滑点必须在0-1之间' 
      });
    }

    // 实际应该更新配置文件或数据库
    console.log('交易配置已更新:', config);
    
    res.json({ 
      success: true, 
      message: '交易配置已更新',
      data: config
    });
  } catch (error) {
    console.error('Error updating trading config:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '更新交易配置失败' 
    });
  }
});

export default router;