import { Router } from 'express';
import { StrategyService } from '../services/strategyService.js';

const router = Router();
const strategyService = new StrategyService();

router.post('/strategies', async (req, res) => {
  try {
    const strategy = await strategyService.createStrategy(req.body);
    res.json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error creating strategy:', error);
    res.status(500).json({ success: false, error: 'Failed to create strategy' });
  }
});

router.get('/strategies', async (req, res) => {
  try {
    const strategies = await strategyService.getAllStrategies();
    res.json({ success: true, data: strategies });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch strategies' });
  }
});

router.get('/strategies/:id', async (req, res) => {
  try {
    const strategy = await strategyService.getStrategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }
    res.json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch strategy' });
  }
});

router.put('/strategies/:id', async (req, res) => {
  try {
    const strategy = await strategyService.updateStrategy(req.params.id, req.body);
    if (!strategy) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }
    res.json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error updating strategy:', error);
    res.status(500).json({ success: false, error: 'Failed to update strategy' });
  }
});

router.delete('/strategies/:id', async (req, res) => {
  try {
    const deleted = await strategyService.deleteStrategy(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }
    res.json({ success: true, message: 'Strategy deleted successfully' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    res.status(500).json({ success: false, error: 'Failed to delete strategy' });
  }
});

router.post('/strategies/:id/signals', async (req, res) => {
  try {
    const { symbol, timeframe } = req.body;
    const signals = await strategyService.generateSignals(req.params.id, symbol, timeframe);
    res.json({ success: true, data: signals });
  } catch (error) {
    console.error('Error generating signals:', error);
    res.status(500).json({ success: false, error: 'Failed to generate signals' });
  }
});

router.post('/strategies/:id/backtest', async (req, res) => {
  try {
    const { symbol, start_date, end_date, initial_capital } = req.body;
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    if (startDate >= endDate) {
      return res.status(400).json({ success: false, error: 'Start date must be before end date' });
    }
    
    const backtestResult = await strategyService.backtestStrategy(
      req.params.id,
      symbol,
      startDate,
      endDate,
      initial_capital || 10000
    );
    
    res.json({ success: true, data: backtestResult });
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({ success: false, error: 'Failed to run backtest' });
  }
});

router.get('/strategies/:id/performance', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required' });
    }
    
    const startDate = new Date(start_date as string);
    const endDate = new Date(end_date as string);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    // For now, return a mock performance summary
    // In a real implementation, this would calculate actual performance metrics
    const performance = {
      strategy_id: req.params.id,
      period: {
        start: startDate,
        end: endDate
      },
      metrics: {
        total_return: 15.2,
        annualized_return: 18.5,
        max_drawdown: 8.3,
        sharpe_ratio: 1.42,
        win_rate: 62.5,
        total_trades: 48,
        avg_trade_duration: '2.3 days',
        profit_factor: 1.68
      },
      monthly_returns: [
        { month: '2024-01', return: 2.1 },
        { month: '2024-02', return: -1.5 },
        { month: '2024-03', return: 3.8 },
        { month: '2024-04', return: 1.2 },
        { month: '2024-05', return: -0.8 },
        { month: '2024-06', return: 4.2 }
      ]
    };
    
    res.json({ success: true, data: performance });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance' });
  }
});

export default router;