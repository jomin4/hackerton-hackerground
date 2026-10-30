import { describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';

import { createApp } from '../../src/app.js';

describe('unexpected errors', () => {
  it('returns a generic internal error without exposing repository details', async () => {
    const app = createApp({
      spots: {
        findAll: () => {
          throw new Error('db secret path /etc/x');
        },
        findById: () => undefined,
      },
      version: 'test',
      logger: pino({ level: 'silent' }),
    });

    const response = await request(app).get('/api/spots').expect(500);

    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.text).not.toContain('secret');
  });
});
