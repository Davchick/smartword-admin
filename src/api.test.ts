import { adminFetch, ApiError } from './api';

const config = { token: 'tkn', email: 'admin@localhost' };

describe('adminFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds auth headers and returns json', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await adminFetch<{ ok: boolean }>('/overview', config);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'x-admin-token': 'tkn',
      'x-admin-email': 'admin@localhost',
    });
  });

  it('throws ApiError on non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized', message: 'Invalid token' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(adminFetch('/overview', config)).rejects.toBeInstanceOf(ApiError);
  });
});
