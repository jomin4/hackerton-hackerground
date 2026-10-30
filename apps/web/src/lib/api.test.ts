import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, fetchJson } from './api.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  it('returns successful JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ value: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(fetchJson<{ value: number }>('/api/test')).resolves.toEqual({ value: 1 });
  });

  it('throws an ApiError with the API error response details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'BAD_QUERY', message: '잘못된 조건이에요.' } }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    await expect(fetchJson('/api/test')).rejects.toMatchObject({
      status: 400,
      code: 'BAD_QUERY',
      message: '잘못된 조건이에요.',
    });
  });

  it('wraps network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(fetchJson('/api/test')).rejects.toBeInstanceOf(ApiError);
  });
});
