import { config } from './config.js';
import { initDb, closeDb } from './db/database.js';
import { app } from './app.js';
import { logger } from './utils/logger.js';

initDb();

const server = app.listen(config.port, () => {
  logger.info(`LinkedIn Profile Optimizer listening on port ${config.port}`, {
    port: config.port,
    env: config.nodeEnv
  });
});

function handleShutdown(signal) {
  logger.info(`Received ${signal}, closing server gracefully`);
  server.close(() => {
    closeDb();
    logger.info('Database closed and server terminated cleanly');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
