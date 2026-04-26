import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminMutations } from './useAdminMutations';

const adminFetchMock = vi.fn();

vi.mock('../api', () => ({
  adminFetch: (...args: unknown[]) => adminFetchMock(...args),
}));

describe('useAdminMutations concurrency', () => {
  beforeEach(() => {
    adminFetchMock.mockReset();
  });

  it('keeps isBusy true while overlapping mutations are in-flight', async () => {
    let resolveFirst: (() => void) | null = null;
    let resolveSecond: (() => void) | null = null;

    adminFetchMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = () => resolve({}); }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = () => resolve({}); }));

    const { result } = renderHook(() => useAdminMutations({ token: 't', email: 'a@a.a' }));

    let firstPromise!: Promise<boolean>;
    let secondPromise!: Promise<boolean>;
    await act(async () => {
      firstPromise = result.current.resetWeeklyLimit('u1');
      secondPromise = result.current.resetWeeklyLimit('u2');
    });

    expect(result.current.isBusy).toBe(true);

    await act(async () => {
      resolveFirst?.();
      await firstPromise;
    });
    expect(result.current.isBusy).toBe(true);

    await act(async () => {
      resolveSecond?.();
      await secondPromise;
    });
    expect(result.current.isBusy).toBe(false);
  });
});
