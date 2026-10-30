import express from 'express';
import pinoHttp from 'pino-http';
import type { Logger } from 'pino';

import type { SpotRepository } from './data/spot-repository.js';
import { createErrorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { createHealthRouter } from './routes/health.js';
import { createSpotsRouter } from './routes/spots.js';

export interface AppDependencies {
  spots: SpotRepository;
  version: string;
  logger: Logger;
}

export function createApp({ spots, version, logger }: AppDependencies): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_request, response, error) => {
        if (error || response.statusCode >= 500) return 'error';
        if (response.statusCode >= 400) return 'info';
        return 'info';
      },
    }),
  );
  app.use('/api/health', createHealthRouter(spots, version));
  app.use('/api/spots', createSpotsRouter(spots));
  app.use(notFound);
  app.use(createErrorHandler(logger));

  return app;
}
