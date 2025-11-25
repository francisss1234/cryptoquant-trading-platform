/**
 * Ultra-simplified Express server for Vercel deployment
 * Minimal setup for basic API functionality
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check endpoint - CRITICAL for Vercel
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CryptoQuant API',
    version: '1.0.0'
  });
});

// Root endpoint - CRITICAL for Vercel
app.get('/', (req, res) => {
  res.json({ 
    message: 'CryptoQuant API Server is running',
    version: '1.0.0',
    status: 'operational',
    endpoints: [
      'GET /health - Health check',
      'GET /api - API routes',
      'WebSocket support available'
    ]
  });
});

// Basic API routes
app.get('/api/market/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol,
    price: Math.random() * 50000 + 1000, // Mock price
    timestamp: Date.now(),
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5
  });
});

app.get('/api/strategies', (req, res) => {
  res.json({
    strategies: [
      { id: 1, name: 'MA Crossover', status: 'active' },
      { id: 2, name: 'RSI Strategy', status: 'inactive' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// For local development only
if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`🚀 CryptoQuant API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;