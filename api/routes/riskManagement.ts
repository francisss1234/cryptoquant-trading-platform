import { Router } from 'express';
import { RiskManagementService } from '../services/riskManagementService.js';

const router = Router();

// Create instance of risk management service
const riskManagementService = new RiskManagementService();

// Get portfolio risk metrics
router.get('/portfolio-metrics', async (req, res) => {
  try {
    const metrics = await riskManagementService.calculatePortfolioRiskMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating portfolio risk metrics:', error);
    res.status(500).json({ 
      error: 'Failed to calculate portfolio risk metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get position risk for a specific position
router.get('/position-risk/:positionId', async (req, res) => {
  try {
    const { positionId } = req.params;
    const positionRisk = await riskManagementService.calculatePositionRisk(positionId);
    
    if (!positionRisk) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.json(positionRisk);
  } catch (error) {
    console.error('Error calculating position risk:', error);
    res.status(500).json({ 
      error: 'Failed to calculate position risk',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all risk alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await riskManagementService.checkRiskLimits();
    res.json(alerts);
  } catch (error) {
    console.error('Error checking risk limits:', error);
    res.status(500).json({ 
      error: 'Failed to check risk limits',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update risk limits
router.put('/limits', async (req, res) => {
  try {
    const updatedLimits = await riskManagementService.updateRiskLimits(req.body);
    res.json(updatedLimits);
  } catch (error) {
    console.error('Error updating risk limits:', error);
    res.status(500).json({ 
      error: 'Failed to update risk limits',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current risk limits
router.get('/limits', async (req, res) => {
  try {
    const limits = await riskManagementService.getRiskLimits();
    res.json(limits);
  } catch (error) {
    console.error('Error getting risk limits:', error);
    res.status(500).json({ 
      error: 'Failed to get risk limits',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;