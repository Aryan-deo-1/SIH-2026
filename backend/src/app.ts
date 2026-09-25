import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.routes';
import productRoutes from './routes/product.routes';
import searchRoutes from './routes/search.routes';
import compareRoutes from './routes/compare.routes';
import historyRoutes from './routes/history.routes';
import adminRoutes from './routes/admin.routes';
import complianceRoutes from './routes/compliance.routes';
import aiRoutes from './routes/ai.routes';
import { ENV } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { dbService } from './services/db.service';

export const app = express();

// Trust proxy for proper IP & protocol resolution behind Cloudflare / InHank edge routers
app.set('trust proxy', 1);

// Production-safe HTTP request logger (runs BEFORE CORS and routers to record all incoming traffic)
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[HTTP Incoming] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP Completed] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Allowed CORS origins
const allowedOrigins = [
  'https://packchecking.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...(ENV.CLIENT_URL ? [ENV.CLIENT_URL.replace(/\/+$/, '')] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/+$/, '')] : []),
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, '')) : [])
];

const uniqueAllowedOrigins = Array.from(new Set(allowedOrigins.filter(Boolean)));

// CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, InHank internal probes)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        uniqueAllowedOrigins.includes(normalizedOrigin) ||
        uniqueAllowedOrigins.includes('*') ||
        /^https:\/\/[a-z0-9-]+--packchecking\.netlify\.app$/.test(normalizedOrigin) ||
        normalizedOrigin === 'https://packchecking.netlify.app'
      ) {
        return callback(null, true);
      }
      // Permissive in non-production
      if (ENV.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Root endpoint for platform routing & deployment verification
app.get('/', (_req, res) => {
  res.json({
    service: 'PackCheck Backend API',
    status: 'RUNNING'
  });
});

// API base endpoint
app.get('/api', (_req, res) => {
  res.json({
    service: 'PackCheck Backend API',
    status: 'RUNNING',
    health: '/api/health'
  });
});

// Health Check (supports /api/health and standard container platform probes /health, /healthz)
app.get(['/api/health', '/health', '/healthz'], async (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'PackCheck Backend API',
    database: dbService.isConnected ? 'POSTGRES_CONNECTED' : 'IN_MEMORY_FAILOVER',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api', scanRoutes);
app.use('/api', productRoutes);
app.use('/api', searchRoutes);
app.use('/api', compareRoutes);
app.use('/api', historyRoutes);
app.use('/api', adminRoutes);
app.use('/api', complianceRoutes);
app.use('/api', aiRoutes);

// Centralized error handler
app.use(errorHandler);
