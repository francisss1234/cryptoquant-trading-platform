/**
 * Simplified Express server for Vercel deployment
 * Basic setup without WebSocket for initial deployment
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/market.js';
import strategyRoutes from './routes/strategies.js';
import tradingRoutes from './routes/trading.js';
import riskRoutes from './routes/riskManagement.js';
import indicatorRoutes from './routes/indicators.js';
import visualizationRoutes from './routes/visualization.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/visualization', visualizationRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // For Vercel, static files are served automatically
  app.get('/', (req, res) => {
    res.json({ 
      message: 'CryptoQuant API Server is running',
      version: '1.0.0',
      status: 'operational'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      timestamp: new Date().toISOString()
    }
  });
});

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`🚀 CryptoQuant API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
}

export default app;