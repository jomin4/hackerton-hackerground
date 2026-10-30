export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

export async function fetchJson<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : '서버에 연결할 수 없어요.';
    throw new ApiError(0, 'NETWORK_ERROR', message);
  }

  if (!response.ok) {
    const payload: ErrorPayload = await response.json().catch(() => ({}));
    const code = typeof payload.error?.code === 'string' ? payload.error.code : 'HTTP_ERROR';
    const message =
      typeof payload.error?.message === 'string'
        ? payload.error.message
        : response.statusText || '요청을 처리할 수 없어요.';
    throw new ApiError(response.status, code, message);
  }

  return (await response.json()) as T;
}
