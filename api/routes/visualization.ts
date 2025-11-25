import express from 'express'
import { VisualizationService } from '../services/visualizationService.js'

const router = express.Router()
const visualizationService = new VisualizationService()

/**
 * @route   GET /api/visualization/performance-report
 * @desc    Get performance report with metrics and charts
 * @access  Public
 */
router.get('/performance-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const start = startDate ? new Date(startDate as string) : undefined
    const end = endDate ? new Date(endDate as string) : undefined
    
    const report = await visualizationService.generatePerformanceReport(start, end)
    
    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error generating performance report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance report'
    })
  }
})

/**
 * @route   GET /api/visualization/heatmap
 * @desc    Get correlation heatmap data
 * @access  Public
 */
router.get('/heatmap', async (req, res) => {
  try {
    const { symbols } = req.query
    const symbolList = symbols ? (symbols as string).split(',') : ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']
    
    const heatmapData = await visualizationService.generateCorrelationHeatmap(symbolList)
    
    res.json({
      success: true,
      data: heatmapData
    })
  } catch (error) {
    console.error('Error generating heatmap:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate heatmap'
    })
  }
})

/**
 * @route   GET /api/visualization/chart/:type
 * @desc    Generate SVG chart
 * @access  Public
 */
router.get('/chart/:type', async (req, res) => {
  try {
    const { type } = req.params
    const { width = 800, height = 400, data } = req.query
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Chart data is required'
      })
    }
    
    const chartData = JSON.parse(data as string)
    const chartWidth = parseInt(width as string)
    const chartHeight = parseInt(height as string)
    
    let svg: string
    
    switch (type) {
      case 'line':
        svg = await visualizationService.generateLineChart(chartData, chartWidth, chartHeight)
        break
      case 'candlestick':
        svg = await visualizationService.generateCandlestickChart(chartData, chartWidth, chartHeight)
        break
      case 'bar':
        svg = await visualizationService.generateBarChart(chartData, chartWidth, chartHeight)
        break
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid chart type. Supported types: line, candlestick, bar'
        })
    }
    
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svg)
  } catch (error) {
    console.error('Error generating chart:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate chart'
    })
  }
})

/**
 * @route   GET /api/visualization/portfolio-composition
 * @desc    Get portfolio composition data
 * @access  Public
 */
router.get('/portfolio-composition', async (req, res) => {
  try {
    const composition = await visualizationService.getPortfolioComposition()
    
    res.json({
      success: true,
      data: composition
    })
  } catch (error) {
    console.error('Error getting portfolio composition:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get portfolio composition'
    })
  }
})

/**
 * @route   GET /api/visualization/trade-distribution
 * @desc    Get trade distribution analysis
 * @access  Public
 */
router.get('/trade-distribution', async (req, res) => {
  try {
    const { timeFrame = 'daily' } = req.query
    
    const distribution = await visualizationService.getTradeDistribution(timeFrame as string)
    
    res.json({
      success: true,
      data: distribution
    })
  } catch (error) {
    console.error('Error getting trade distribution:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get trade distribution'
    })
  }
})

export default router