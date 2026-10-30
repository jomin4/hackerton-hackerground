import { describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';

import { createApp } from '../../src/app.js';
import { createInMemoryRepository } from '../../src/data/spot-repository.js';
import { spots } from '../fixtures/spots.js';

const app = createApp({
  spots: createInMemoryRepository(spots),
  version: 'test',
  logger: pino({ level: 'silent' }),
});

describe('GET /api/spots', () => {
  it('returns summaries and total count', async () => {
    const response = await request(app).get('/api/spots').expect(200);

    expect(response.body.total).toBe(spots.length);
    expect(response.body.items).toHaveLength(spots.length);
    expect(Object.keys(response.body.items[0]).sort()).toEqual(
      ['id', 'name', 'summary', 'zone', 'tags', 'stayMinutes'].sort(),
    );
    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('filters by tag', async () => {
    const response = await request(app).get('/api/spots?tag=food').expect(200);

    expect(response.body.items.length).toBeGreaterThan(0);
    expect(
      response.body.items.every((spot: { tags: string[] }) => spot.tags.includes('food')),
    ).toBe(true);
  });

  it('rejects unknown tags with a structured validation error', async () => {
    const response = await request(app).get('/api/spots?tag=unknown').expect(400);

    expect(response.body.error.code).toBe('INVALID_QUERY');
    expect(response.body.error.details[0]).toMatchObject({
      field: 'tag',
      value: 'unknown',
    });
    expect(response.body.error.message).toBe(
      '관심사는 nature, history, experience, food, photo 중에서 골라주세요.',
    );
  });

  it('filters by zone', async () => {
    const response = await request(app).get('/api/spots?zone=hwayang-eup').expect(200);

    expect(response.body.items.every((spot: { zone: string }) => spot.zone === 'hwayang-eup')).toBe(
      true,
    );
  });
});

describe('GET /api/spots/:id', () => {
  it('returns the spot and nearby spots in route order', async () => {
    const response = await request(app).get('/api/spots/wine-tunnel').expect(200);

    expect(response.body.spot.id).toBe('wine-tunnel');
    expect(response.body.nearby.map((spot: { id: string }) => spot.id)).toEqual([
      'yudeung-yeonji',
      'eupseong',
      'provence',
    ]);
    expect(response.body.nearby).toHaveLength(3);
    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('sorts nearby spots by id when route order is tied', async () => {
    const spotsWithTiedOrder = spots.map((spot) =>
      spot.id === 'eupseong' ? { ...spot, routeOrder: 1 } : spot,
    );
    const appWithTiedOrder = createApp({
      spots: createInMemoryRepository(spotsWithTiedOrder),
      version: 'test',
      logger: pino({ level: 'silent' }),
    });

    const response = await request(appWithTiedOrder).get('/api/spots/wine-tunnel').expect(200);

    expect(response.body.nearby.map((spot: { id: string }) => spot.id)).toEqual([
      'eupseong',
      'yudeung-yeonji',
      'provence',
    ]);
  });

  it('returns SPOT_NOT_FOUND for an unknown spot', async () => {
    const response = await request(app).get('/api/spots/nope').expect(404);

    expect(response.body.error.code).toBe('SPOT_NOT_FOUND');
  });
});

describe('unknown API paths', () => {
  it('returns NOT_FOUND', async () => {
    const response = await request(app).get('/api/nope').expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
