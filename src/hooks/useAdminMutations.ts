import { useCallback, useRef, useState } from 'react';
import { adminFetch } from '../api';
import type { AdminConfig, AdminUserDetail } from '../types';

export interface BulkOperationResult {
  user_id: string;
  success: boolean;
  error?: string;
}

export interface BulkOperationResponse {
  results: BulkOperationResult[];
  total: number;
  succeeded: number;
  failed: number;
}

export function useAdminMutations(config: AdminConfig) {
  const [isBusy, setIsBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const pendingMutationsRef = useRef<Map<string, boolean>>(new Map());
  const mutationIdRef = useRef(0);

  const createMutationId = useCallback(() => {
    mutationIdRef.current += 1;
    return `mutation-${mutationIdRef.current}`;
  }, []);

  const runMutation = useCallback(async <T,>(
    mutation: () => Promise<T>,
    errorMessage: string,
    successMessage?: string,
  ): Promise<T | null> => {
    const mutationId = createMutationId();
    pendingMutationsRef.current.set(mutationId, true);
    setIsBusy(true);
    setLastError(null);
    setLastSuccess(null);
    try {
      const result = await mutation();
      if (successMessage) setLastSuccess(successMessage);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage;
      setLastError(message);
      return null;
    } finally {
      pendingMutationsRef.current.delete(mutationId);
      setIsBusy(pendingMutationsRef.current.size > 0);
    }
  }, [createMutationId]);

  const updateUserEmail = useCallback(async (
    userId: string,
    email: string,
  ): Promise<AdminUserDetail | null> => {
    return runMutation(
      async () => adminFetch<AdminUserDetail>(`/users/${userId}`, config, {
        method: 'PATCH',
        body: JSON.stringify({ email }),
      }),
      'Failed to update email',
      `Email updated to ${email}`,
    );
  }, [config, runMutation]);

  const grantSubscription = useCallback(async (
    userId: string,
    durationDays: number,
    planId: string,
  ): Promise<AdminUserDetail | null> => {
    return runMutation(
      async () => adminFetch<AdminUserDetail>(`/users/${userId}/subscription`, config, {
        method: 'PATCH',
        body: JSON.stringify({ duration_days: durationDays, plan_id: planId }),
      }),
      'Failed to grant subscription',
      `Subscription granted for ${durationDays} days`,
    );
  }, [config, runMutation]);

  const resetWeeklyLimit = useCallback(async (userId: string): Promise<boolean> => {
    const result = await runMutation(
      async () => adminFetch(`/users/${userId}/reset-weekly-limit`, config, {
        method: 'POST',
      }),
      'Failed to reset limit',
      'Weekly limit reset',
    );
    return Boolean(result);
  }, [config, runMutation]);

  const bulkGrantSubscription = useCallback(async (
    userIds: string[],
    durationDays: number,
    planId: string,
  ): Promise<BulkOperationResponse | null> => {
    if (userIds.length === 0) {
      setLastError('No users selected');
      return null;
    }
    return runMutation(
      async () => adminFetch<BulkOperationResponse>('/users/bulk/grant-subscription', config, {
        method: 'POST',
        body: JSON.stringify({
          user_ids: userIds,
          duration_days: durationDays,
          plan_id: planId,
        }),
      }),
      'Failed to grant bulk subscription',
      `Bulk operation requested for ${userIds.length} users`,
    );
  }, [config, runMutation]);

  const clearFeedback = useCallback(() => {
    setLastError(null);
    setLastSuccess(null);
  }, []);

  return {
    isBusy,
    lastError,
    lastSuccess,
    updateUserEmail,
    grantSubscription,
    resetWeeklyLimit,
    bulkGrantSubscription,
    clearFeedback,
  };
}