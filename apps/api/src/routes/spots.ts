import { Router } from 'express';
import { spotsQuerySchema } from '@cheongdo/shared';
import type { Spot, SpotSummary } from '@cheongdo/shared';

import type { SpotRepository } from '../data/spot-repository.js';
import { HttpError } from '../lib/http-error.js';

function toSummary(spot: Spot): SpotSummary {
  const { id, name, summary, zone, tags, stayMinutes } = spot;
  return { id, name, summary, zone, tags, stayMinutes };
}

export function createSpotsRouter(spots: SpotRepository): Router {
  const router = Router();

  router.get('/', (request, response) => {
    const query = spotsQuerySchema.parse(request.query);
    const results = spots
      .findAll()
      .filter((spot) => query.tag === undefined || spot.tags.includes(query.tag))
      .filter((spot) => query.zone === undefined || spot.zone === query.zone);
    const items = results.map(toSummary);

    response.setHeader('Cache-Control', 'public, max-age=300');
    response.json({ items, total: items.length });
  });

  router.get('/:id', (request, response) => {
    const spot = spots.findById(request.params.id);
    if (!spot) {
      throw new HttpError(404, 'SPOT_NOT_FOUND', '관광지를 찾을 수 없어요.');
    }

    const nearby = spots
      .findAll()
      .filter((candidate) => candidate.zone === spot.zone && candidate.id !== spot.id)
      .sort(
        (left, right) =>
          left.routeOrder - right.routeOrder ||
          (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
      )
      .slice(0, 3)
      .map(toSummary);

    response.setHeader('Cache-Control', 'public, max-age=300');
    response.json({ spot, nearby });
  });

  return router;
}
