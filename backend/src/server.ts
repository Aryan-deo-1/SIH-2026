import { app } from './app';
import { ENV } from './config/env';
import { dbService } from './services/db.service';

const server = app.listen(ENV.PORT, ENV.HOST, async () => {
  console.log(`=========================================`);
  console.log(`  PACKCHECK API SERVER RUNNING           `);
  console.log(`  Address: http://${ENV.HOST}:${ENV.PORT} `);
  console.log(`  Localhost: http://localhost:${ENV.PORT}`);
  console.log(`  Environment: ${ENV.NODE_ENV}           `);
  console.log(`=========================================`);

  // Verify PostgreSQL connection and pool
  await dbService.testConnection();
});

// Configure socket keep-alive and headers timeout to prevent premature TCP socket closure (ECONNRESET)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Prevent server process termination from unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('[Process] Unhandled Promise Rejection (non-fatal):', reason?.stack || reason?.message || reason);
});

// Prevent server process crash on uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('[Process] Uncaught Exception:', err.stack || err.message);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('Shutdown signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed cleanly');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
