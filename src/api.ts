const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type AdminConfig = {
  token: string;
  email: string;
};

type FetchOptions = RequestInit & {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function buildHeaders(config: AdminConfig): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': config.token,
    'x-admin-email': config.email,
  };
}

export async function adminFetch<T>(
  path: string,
  config: AdminConfig,
  init?: FetchOptions,
): Promise<T> {
  const controller = new AbortController();
  const signal = init?.signal || controller.signal;
  const timeoutMs = init?.timeoutMs ?? 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...init,
    signal,
    headers: {
      ...buildHeaders(config),
      ...(init?.headers || {}),
    },
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | null = null;
    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
      code = payload.error || null;
    } catch {
      // noop
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}
