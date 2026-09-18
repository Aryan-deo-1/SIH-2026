import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.routes';
import productRoutes from './routes/product.routes';
import searchRoutes from './routes/search.routes';
import compareRoutes from './routes/compare.routes';
import historyRoutes from './routes/history.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';
import { dbService } from './services/db.service';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
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

// Centralized error handler
app.use(errorHandler);
