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

describe('GET /api/course', () => {
  it('returns the documented T1 course and cache header', async () => {
    const response = await request(app)
      .get('/api/course?hours=4&with=family&tags=nature,experience')
      .expect(200);

    expect(response.body.stops.map(({ spot }: { spot: { id: string } }) => spot.id)).toEqual([
      'rail-bike',
      'yudeung-yeonji',
      'wine-tunnel',
      'eupseong',
    ]);
    expect(
      response.body.stops.map(
        ({
          travelMinutes,
          startMinute,
          endMinute,
        }: {
          travelMinutes: number;
          startMinute: number;
          endMinute: number;
        }) => [travelMinutes, startMinute, endMinute],
      ),
    ).toEqual([
      [0, 0, 60],
      [25, 85, 115],
      [10, 125, 165],
      [10, 175, 215],
    ]);
    expect(response.body.totals).toEqual({
      budgetMinutes: 240,
      stayMinutes: 170,
      travelMinutes: 45,
      totalMinutes: 215,
      slackMinutes: 25,
    });
    expect(response.body.excluded.map(({ spot }: { spot: { id: string } }) => spot.id)).toEqual([
      'unmunsa',
      'provence',
    ]);
    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('normalizes tag order in the result', async () => {
    const response = await request(app)
      .get('/api/course?hours=4&with=family&tags=experience,nature')
      .expect(200);

    expect(response.body.conditions.tags).toEqual(['nature', 'experience']);
    expect(response.body.stops.map(({ spot }: { spot: { id: string } }) => spot.id)).toEqual([
      'rail-bike',
      'yudeung-yeonji',
      'wine-tunnel',
      'eupseong',
    ]);
  });

  it('returns an empty course with 200 when no spots match', async () => {
    const appWithoutMatchingSpots = createApp({
      spots: createInMemoryRepository(spots.map((spot) => ({ ...spot, tags: ['food'] }))),
      version: 'test',
      logger: pino({ level: 'silent' }),
    });

    const response = await request(appWithoutMatchingSpots)
      .get('/api/course?hours=4&with=family&tags=history')
      .expect(200);

    expect(response.body.stops).toEqual([]);
    expect(response.body.zones).toEqual([]);
  });

  it('keeps unknown excluded IDs in the parsed conditions', async () => {
    const response = await request(app)
      .get('/api/course?hours=4&with=family&tags=nature&exclude=rail-bike,nope')
      .expect(200);

    expect(response.body.conditions.exclude).toEqual(['rail-bike', 'nope']);
    expect(response.body.stops.map(({ spot }: { spot: { id: string } }) => spot.id)).not.toContain(
      'rail-bike',
    );
  });

  it('returns a Korean validation error for invalid hours', async () => {
    const response = await request(app)
      .get('/api/course?hours=99&with=family&tags=nature')
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_QUERY');
    expect(response.body.error.message).toBe('여행 시간은 2, 4, 6 중 하나여야 해요.');
    expect(response.body.error.details[0].field).toBe('hours');
  });

  it('rejects empty interests', async () => {
    const response = await request(app).get('/api/course?hours=4&with=family&tags=').expect(400);

    expect(response.body.error.code).toBe('INVALID_QUERY');
    expect(response.body.error.details[0].field).toBe('tags');
  });

  it('rejects an invalid companion', async () => {
    const response = await request(app)
      .get('/api/course?hours=4&with=alien&tags=nature')
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_QUERY');
    expect(response.body.error.details[0].field).toBe('with');
  });

  it('uses the first issue message and includes all invalid fields', async () => {
    const response = await request(app)
      .get('/api/course?hours=99&with=alien&tags=unknown')
      .expect(400);

    expect(response.body.error.message).toBe('여행 시간은 2, 4, 6 중 하나여야 해요.');
    expect(response.body.error.details.map(({ field }: { field: string }) => field)).toEqual([
      'hours',
      'with',
      'tags.0',
    ]);
  });
});
