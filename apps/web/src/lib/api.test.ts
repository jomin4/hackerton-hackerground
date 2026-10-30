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

  it('uses a Korean fallback for non-JSON server errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>Bad Gateway</body></html>', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(fetchJson('/api/test')).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL_ERROR',
      message: '잠시 후 다시 시도해 주세요.',
    });
  });

  it('uses HTTP_ERROR for non-JSON client errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>Not Found</body></html>', {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(fetchJson('/api/test')).rejects.toMatchObject({
      status: 404,
      code: 'HTTP_ERROR',
      message: '잠시 후 다시 시도해 주세요.',
    });
  });

  it('wraps network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const error = await fetchJson('/api/test').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 0,
      message: '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.',
    });
  });
});
