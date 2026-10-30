import { Router } from 'express';

import type { SpotRepository } from '../data/spot-repository.js';

export function createHealthRouter(spots: SpotRepository, version: string): Router {
  const router = Router();

  router.get('/', (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      status: 'ok',
      version,
      uptimeSeconds: Math.floor(process.uptime()),
      spots: spots.findAll().length,
    });
  });

  return router;
}
