import { createServer } from 'node:http';

import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createInMemoryRepository, loadSpotsFromFile } from './data/spot-repository.js';
import { createLogger } from './lib/logger.js';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);

let loadedSpots;
try {
  loadedSpots = loadSpotsFromFile(config.DATA_PATH);
} catch (error) {
  logger.error({ err: error }, 'Failed to load tourist spot data');
  process.exit(1);
}

const app = createApp({
  spots: createInMemoryRepository(loadedSpots),
  version: config.APP_VERSION,
  logger,
});
const server = createServer(app);

server.on('error', (error) => {
  logger.error({ err: error }, 'Failed to start API server');
  process.exitCode = 1;
});

server.listen(config.PORT, () => {
  logger.info({ port: config.PORT, version: config.APP_VERSION }, 'API server started');
});

function shutdown(): void {
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Failed to close API server cleanly');
      process.exitCode = 1;
      return;
    }
    logger.info('API server stopped');
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
