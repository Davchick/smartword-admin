const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type AdminConfig = {
  token: string;
  email: string;
};

type FetchOptions = RequestInit & {
  signal?: AbortSignal;
  timeoutMs?: number;
};

type CohortResponse = {
  data: Array<{
    cohort_date: string;
    total_users: number;
    retained_users: number;
    retention_rate: number;
    converted_to_premium: number;
    conversion_rate: number;
    revenue: number;
  }>;
  period_start: string;
  period_end: string;
};

type RevenueMetrics = {
  total_revenue: number;
  revenue_change: number | null;
  average_revenue_per_user: number;
  lifetime_value: number;
  arpu_change: number | null;
  ltv_growth: number | null;
};

type ChurnMetrics = {
  churn_rate_30d: number;
  churn_rate_90d: number;
  churned_users_30d: number;
  churned_users_90d: number;
  at_risk_users: number;
};

type BulkOperationResponse = {
  results: Array<{
    user_id: string;
    success: boolean;
    error?: string;
  }>;
  total: number;
  succeeded: number;
  failed: number;
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
    Authorization: `Bearer ${config.token}`,
    'x-admin-token': config.token,
    'x-admin-email': config.email,
  };
}

function backoffMs(attempt: number, baseDelay = 1000): number {
  return Math.min(2 ** attempt * baseDelay, 8000);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status !== 429 || attempt >= maxRetries) {
      return response;
    }

    const delay = backoffMs(attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error('Max retries exceeded');
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

  const response = await fetchWithRetry(
    `${API_BASE_URL}/admin${path}`,
    {
      ...init,
      signal,
      headers: {
        ...buildHeaders(config),
        ...(init?.headers || {}),
      },
    },
  ).finally(() => clearTimeout(timeoutId));

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

export async function fetchCohortData(
  config: AdminConfig,
  periodStart: string,
  periodEnd: string,
): Promise<CohortResponse> {
  return adminFetch<CohortResponse>(
    `/analytics/cohorts?start=${periodStart}&end=${periodEnd}`,
    config,
  );
}

export async function fetchRevenueMetrics(
  config: AdminConfig,
  period: string,
): Promise<RevenueMetrics> {
  return adminFetch<RevenueMetrics>(
    `/analytics/revenue?period=${period}`,
    config,
  );
}

export async function fetchChurnMetrics(
  config: AdminConfig,
  period: string,
): Promise<ChurnMetrics> {
  return adminFetch<ChurnMetrics>(
    `/analytics/churn?period=${period}`,
    config,
  );
}

export async function bulkGrantSubscription(
  config: AdminConfig,
  userIds: string[],
  durationDays: number,
  planId: string,
): Promise<BulkOperationResponse> {
  return adminFetch<BulkOperationResponse>('/users/bulk/grant-subscription', config, {
    method: 'POST',
    body: JSON.stringify({
      user_ids: userIds,
      duration_days: durationDays,
      plan_id: planId,
    }),
  });
}
