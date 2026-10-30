import { describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';

import { createApp } from '../../src/app.js';
import { createInMemoryRepository } from '../../src/data/spot-repository.js';
import { spots } from '../fixtures/spots.js';

const app = createApp({
  spots: createInMemoryRepository(spots),
  version: 'test-version',
  logger: pino({ level: 'silent' }),
});

describe('GET /api/health', () => {
  it('returns health status and disables caching', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      version: 'test-version',
      spots: spots.length,
    });
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number));
    expect(response.headers['cache-control']).toBe('no-store');
  });
});
