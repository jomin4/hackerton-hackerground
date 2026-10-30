export interface ApiErrorDetail {
  field: string;
  value: string;
  issue: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string';
}

function isApiErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.value === 'string' &&
    typeof value.issue === 'string'
  );
}

export async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const errorPayload = isRecord(body) && isApiErrorPayload(body.error) ? body.error : undefined;
    const code = errorPayload
      ? errorPayload.code
      : response.status >= 500
        ? 'INTERNAL_ERROR'
        : 'HTTP_ERROR';
    const message = errorPayload ? errorPayload.message : '잠시 후 다시 시도해 주세요.';
    const details =
      errorPayload &&
      Array.isArray(errorPayload.details) &&
      errorPayload.details.every(isApiErrorDetail)
        ? errorPayload.details
        : undefined;
    throw new ApiError(response.status, code, message, details);
  }

  return (await response.json()) as T;
}
