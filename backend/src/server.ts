import { app } from './app';
import { ENV } from './config/env';
import { dbService } from './services/db.service';

const server = app.listen(ENV.PORT, async () => {
  console.log(`=========================================`);
  console.log(`  PACKCHECK API SERVER RUNNING           `);
  console.log(`  Port: http://localhost:${ENV.PORT}     `);
  console.log(`  Environment: ${ENV.NODE_ENV}           `);
  console.log(`=========================================`);

  // Verify PostgreSQL connection
  await dbService.testConnection();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
