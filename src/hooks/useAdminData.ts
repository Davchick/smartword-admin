import { useCallback, useRef, useState } from 'react';
import { adminFetch } from '../api';
import type {
  AdminConfig,
  AdminAuditResponse,
  AdminOverview,
  AdminUserDetail,
  AdminUsersResponse,
  ConsentsResponse,
  PaymentsResponse,
  PeriodOrCustom,
  UserWordsResponse,
  UserGroupsResponse,
  UserPaymentsResponse,
  TicketsResponse,
  ErrorLogsResponse,
} from '../types';

export type AdminTab = 'overview' | 'users' | 'payments' | 'consents' | 'audit' | 'tickets' | 'errorLogs';

export type UserDetailTab = 'overview' | 'words' | 'groups' | 'payments';

interface UseAdminDataOptions {
  config: AdminConfig;
  defaultPeriod?: PeriodOrCustom;
}

function serializePeriodForAPI(period: PeriodOrCustom): string {
  if (typeof period === 'object' && period !== null && 'type' in period && period.type === 'custom') {
    return `custom_${period.range.start}_${period.range.end}`;
  }
  return period;
}

interface DataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  loadedAt: number | null;
}

type AbortControllers = Record<string, AbortController>;

function makeCacheKey(parts: Array<string | number | boolean | undefined | null>): string {
  return parts.map((part) => String(part ?? '')).join('|');
}

export function useAdminData({ config, defaultPeriod = '30d' }: UseAdminDataOptions) {
  const requestsRef = useRef<AbortControllers>({});
  const [tab, setTab] = useState<AdminTab>('overview');
  const [period, setPeriod] = useState<PeriodOrCustom>(defaultPeriod);

  const [overview, setOverview] = useState<DataState<AdminOverview>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [users, setUsers] = useState<DataState<AdminUsersResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [payments, setPayments] = useState<DataState<PaymentsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [consents, setConsents] = useState<DataState<ConsentsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [audit, setAudit] = useState<DataState<AdminAuditResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [tickets, setTickets] = useState<DataState<TicketsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [errorLogs, setErrorLogs] = useState<DataState<ErrorLogsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [userDetail, setUserDetail] = useState<DataState<AdminUserDetail>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [userWords, setUserWords] = useState<DataState<UserWordsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [userGroups, setUserGroups] = useState<DataState<UserGroupsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const [userPayments, setUserPayments] = useState<DataState<UserPaymentsResponse>>({
    data: null,
    isLoading: false,
    error: null,
    loadedAt: null,
  });
  const queryCacheRef = useRef<Record<string, string>>({});

  const createAbortController = useCallback((key: string) => {
    requestsRef.current[key]?.abort();
    const controller = new AbortController();
    requestsRef.current[key] = controller;
    return controller;
  }, []);

  const fetchingRef = useRef({
    overview: false,
    users: false,
    payments: false,
    consents: false,
    audit: false,
    tickets: false,
    errorLogs: false,
  });

  const fetchOverview = useCallback(async (fetchPeriod?: PeriodOrCustom, skipCache = false) => {
    if (fetchingRef.current.overview) return;
    if (!skipCache && overview.loadedAt && overview.data && !overview.error) {
      return;
    }
    fetchingRef.current.overview = true;
    const activePeriod = fetchPeriod ?? period;
    const controller = createAbortController('overview');
    setOverview((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await adminFetch<AdminOverview>(
        `/overview?period=${serializePeriodForAPI(activePeriod)}`,
        config,
        { signal: controller.signal },
      );
      setOverview({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setOverview((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load overview',
      }));
    } finally {
      fetchingRef.current.overview = false;
    }
  }, [config, period, createAbortController, overview.loadedAt, overview.data, overview.error]);

  const fetchUsers = useCallback(async (page = 1, pageSize = 20, search = '', filters?: UsersFilters, skipCache = false) => {
    const cacheKey = makeCacheKey([
      page,
      pageSize,
      search,
      filters?.isPremium,
      filters?.createdAfter,
      filters?.createdBefore,
      filters?.hasActivity,
      filters?.hasWords,
      filters?.hasGroups,
      filters?.verified,
      filters?.lastActiveAfter,
      filters?.lastActiveBefore,
      filters?.wordsLearnedMin,
      filters?.wordsLearnedMax,
    ]);
    if (!skipCache && users.loadedAt && users.data && !users.error && queryCacheRef.current.users === cacheKey) {
      return;
    }
    const controller = createAbortController('users');
    setUsers((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
      ]);
      if (search) params.set('search', search);
      if (filters?.isPremium !== undefined) params.set('isPremium', String(filters.isPremium));
      if (filters?.createdAfter) params.set('createdAfter', filters.createdAfter);
      if (filters?.createdBefore) params.set('createdBefore', filters.createdBefore);
      if (filters?.hasActivity !== undefined) params.set('hasActivity', String(filters.hasActivity));
      if (filters?.hasWords !== undefined) params.set('hasWords', String(filters.hasWords));
      if (filters?.hasGroups !== undefined) params.set('hasGroups', String(filters.hasGroups));
      if (filters?.verified !== undefined) params.set('verified', String(filters.verified));
      if (filters?.lastActiveAfter) params.set('lastActiveAfter', filters.lastActiveAfter);
      if (filters?.lastActiveBefore) params.set('lastActiveBefore', filters.lastActiveBefore);
      if (filters?.wordsLearnedMin !== undefined) params.set('wordsLearnedMin', String(filters.wordsLearnedMin));
      if (filters?.wordsLearnedMax !== undefined) params.set('wordsLearnedMax', String(filters.wordsLearnedMax));

      const data = await adminFetch<AdminUsersResponse>(
        `/users?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.users = cacheKey;
      setUsers({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setUsers((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load users',
      }));
    }
  }, [config, createAbortController, users.loadedAt, users.data, users.error]);

  const fetchPayments = useCallback(async (
    page = 1,
    pageSize = 20,
    fetchPeriod?: PeriodOrCustom,
    search?: string,
    status?: string,
    skipCache = false,
  ) => {
    const cacheKey = makeCacheKey([page, pageSize, serializePeriodForAPI(fetchPeriod ?? period), search, status]);
    if (!skipCache && payments.loadedAt && payments.data && !payments.error && queryCacheRef.current.payments === cacheKey) {
      return;
    }
    const activePeriod = fetchPeriod ?? period;
    const controller = createAbortController('payments');
    setPayments((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
        ['period', serializePeriodForAPI(activePeriod)],
      ]);
      if (search) params.set('search', search);
      if (status) params.set('status', status);

      const data = await adminFetch<PaymentsResponse>(
        `/payments?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.payments = cacheKey;
      setPayments({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setPayments((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load payments',
      }));
    }
  }, [config, period, createAbortController, payments.loadedAt, payments.data, payments.error]);

  const fetchConsents = useCallback(async (
    page = 1,
    pageSize = 20,
    fetchPeriod?: PeriodOrCustom,
    search?: string,
    consentType?: string,
    granted?: boolean,
    skipCache = false,
  ) => {
    const cacheKey = makeCacheKey([page, pageSize, serializePeriodForAPI(fetchPeriod ?? period), search, consentType, granted]);
    if (!skipCache && consents.loadedAt && consents.data && !consents.error && queryCacheRef.current.consents === cacheKey) {
      return;
    }
    const activePeriod = fetchPeriod ?? period;
    const controller = createAbortController('consents');
    setConsents((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
        ['period', serializePeriodForAPI(activePeriod)],
      ]);
      if (search) params.set('search', search);
      if (consentType) params.set('consentType', consentType);
      if (granted !== undefined) params.set('granted', String(granted));

      const data = await adminFetch<ConsentsResponse>(
        `/consents?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.consents = cacheKey;
      setConsents({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setConsents((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load consents',
      }));
    }
  }, [config, period, createAbortController, consents.loadedAt, consents.data, consents.error]);

  const fetchAudit = useCallback(async (
    page = 1,
    pageSize = 20,
    fetchPeriod?: PeriodOrCustom,
    search?: string,
    action?: string,
    outcome?: string,
    skipCache = false,
  ) => {
    const cacheKey = makeCacheKey([page, pageSize, serializePeriodForAPI(fetchPeriod ?? period), search, action, outcome]);
    if (!skipCache && audit.loadedAt && audit.data && !audit.error && queryCacheRef.current.audit === cacheKey) {
      return;
    }
    const activePeriod = fetchPeriod ?? period;
    const controller = createAbortController('audit');
    setAudit((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
        ['period', serializePeriodForAPI(activePeriod)],
      ]);
      if (search) params.set('search', search);
      if (action) params.set('action', action);
      if (outcome) params.set('outcome', outcome);

      const data = await adminFetch<AdminAuditResponse>(
        `/audit?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.audit = cacheKey;
      setAudit({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setAudit((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load audit',
      }));
    }
  }, [config, period, createAbortController, audit.loadedAt, audit.data, audit.error]);

  const fetchTickets = useCallback(async (
    page = 1,
    pageSize = 20,
    fetchPeriod?: PeriodOrCustom,
    search?: string,
    status?: string,
    priority?: string,
    skipCache = false,
  ) => {
    const cacheKey = makeCacheKey([page, pageSize, serializePeriodForAPI(fetchPeriod ?? period), search, status, priority]);
    if (!skipCache && tickets.loadedAt && tickets.data && !tickets.error && queryCacheRef.current.tickets === cacheKey) {
      return;
    }
    const activePeriod = fetchPeriod ?? period;
    const controller = createAbortController('tickets');
    setTickets((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
        ['period', serializePeriodForAPI(activePeriod)],
      ]);
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);

      const data = await adminFetch<TicketsResponse>(
        `/tickets?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.tickets = cacheKey;
      setTickets({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setTickets((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load tickets',
      }));
    }
  }, [config, period, createAbortController, tickets.loadedAt, tickets.data, tickets.error]);

  const fetchErrorLogs = useCallback(async (
    page = 1,
    pageSize = 20,
    fetchPeriod?: PeriodOrCustom,
    search?: string,
    errorType?: string,
    resolved?: boolean,
    userId?: string,
    skipCache = false,
  ) => {
    const cacheKey = makeCacheKey([page, pageSize, serializePeriodForAPI(fetchPeriod ?? period), search, errorType, resolved, userId]);
    if (!skipCache && errorLogs.loadedAt && errorLogs.data && !errorLogs.error && queryCacheRef.current.errorLogs === cacheKey) {
      return;
    }
    const activePeriod = fetchPeriod ?? period;
    const controller = createAbortController('error-logs');
    setErrorLogs((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
        ['period', serializePeriodForAPI(activePeriod)],
      ]);
      if (search) params.set('search', search);
      if (errorType) params.set('errorType', errorType);
      if (resolved !== undefined) params.set('resolved', String(resolved));
      if (userId) params.set('userId', userId);

      const data = await adminFetch<ErrorLogsResponse>(
        `/error-logs?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.errorLogs = cacheKey;
      setErrorLogs({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setErrorLogs((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load error logs',
      }));
    }
  }, [config, period, createAbortController, errorLogs.loadedAt, errorLogs.data, errorLogs.error]);

  const fetchUserWords = useCallback(async (userId: string, page = 1, pageSize = 20, search?: string, skipCache = false) => {
    const cacheKey = makeCacheKey([userId, page, pageSize, search]);
    if (!skipCache && userWords.loadedAt && userWords.data && !userWords.error && queryCacheRef.current.userWords === cacheKey) {
      return;
    }
    const controller = createAbortController('user-words');
    setUserWords((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
      ]);
      if (search) params.set('search', search);

      const data = await adminFetch<UserWordsResponse>(
        `/users/${userId}/words?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.userWords = cacheKey;
      setUserWords({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setUserWords((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load user words',
      }));
    }
  }, [config, createAbortController, userWords.loadedAt, userWords.data, userWords.error]);

  const fetchUserGroups = useCallback(async (userId: string, page = 1, pageSize = 20, search?: string, skipCache = false) => {
    const cacheKey = makeCacheKey([userId, page, pageSize, search]);
    if (!skipCache && userGroups.loadedAt && userGroups.data && !userGroups.error && queryCacheRef.current.userGroups === cacheKey) {
      return;
    }
    const controller = createAbortController('user-groups');
    setUserGroups((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
      ]);
      if (search) params.set('search', search);

      const data = await adminFetch<UserGroupsResponse>(
        `/users/${userId}/groups?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.userGroups = cacheKey;
      setUserGroups({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setUserGroups((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load user groups',
      }));
    }
  }, [config, createAbortController, userGroups.loadedAt, userGroups.data, userGroups.error]);

  const fetchUserPayments = useCallback(async (userId: string, page = 1, pageSize = 20, skipCache = false) => {
    const cacheKey = makeCacheKey([userId, page, pageSize]);
    if (!skipCache && userPayments.loadedAt && userPayments.data && !userPayments.error && queryCacheRef.current.userPayments === cacheKey) {
      return;
    }
    const controller = createAbortController('user-payments');
    setUserPayments((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams([
        ['page', String(page)],
        ['pageSize', String(pageSize)],
      ]);

      const data = await adminFetch<UserPaymentsResponse>(
        `/users/${userId}/payments?${params.toString()}`,
        config,
        { signal: controller.signal },
      );
      queryCacheRef.current.userPayments = cacheKey;
      setUserPayments({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setUserPayments((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load user payments',
      }));
    }
  }, [config, createAbortController, userPayments.loadedAt, userPayments.data, userPayments.error]);

  const fetchUserDetail = useCallback(async (userId: string, skipCache = false) => {
    if (!skipCache && userDetail.loadedAt && userDetail.data && !userDetail.error) {
      if (userDetail.data.id === userId) {
        return;
      }
    }
    const controller = createAbortController('user-detail');
    setUserDetail((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await adminFetch<AdminUserDetail>(
        `/users/${userId}`,
        config,
        { signal: controller.signal },
      );
      setUserDetail({ data, isLoading: false, error: null, loadedAt: Date.now() });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setUserDetail((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load user',
      }));
    }
  }, [config, createAbortController, userDetail.loadedAt, userDetail.data, userDetail.error]);

  const loadCurrentTab = useCallback(async (forceReload = false) => {
    switch (tab) {
      case 'overview':
        return fetchOverview(undefined, forceReload);
      case 'users':
        return fetchUsers(1, 20, '', undefined, forceReload);
      case 'payments':
        return fetchPayments(1, 20, undefined, undefined, undefined, forceReload);
      case 'consents':
        return fetchConsents(1, 20, undefined, undefined, undefined, undefined, forceReload);
      case 'audit':
        return fetchAudit(1, 20, undefined, undefined, undefined, undefined, forceReload);
      case 'tickets':
        return fetchTickets(1, 20, undefined, undefined, undefined, undefined, forceReload);
      case 'errorLogs':
        return fetchErrorLogs(1, 20, undefined, undefined, undefined, undefined, undefined, forceReload);
      default:
        return undefined;
    }
  }, [tab, fetchOverview, fetchUsers, fetchPayments, fetchConsents, fetchAudit, fetchTickets, fetchErrorLogs]);

  const abortAll = useCallback(() => {
    Object.values(requestsRef.current).forEach((controller) => controller.abort());
  }, []);

  return {
    tab,
    setTab,
    period,
    setPeriod: setPeriod as (period: PeriodOrCustom | ((prev: PeriodOrCustom) => PeriodOrCustom)) => void,
    overview,
    users,
    payments,
    consents,
    audit,
    tickets,
    errorLogs,
    userDetail,
    userWords,
    userGroups,
    userPayments,
    fetchOverview,
    fetchUsers,
    fetchPayments,
    fetchConsents,
    fetchAudit,
    fetchTickets,
    fetchErrorLogs,
    fetchUserDetail,
    fetchUserWords,
    fetchUserGroups,
    fetchUserPayments,
    loadCurrentTab,
    abortAll,
  };
}

export interface UsersFilters {
  isPremium?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  hasActivity?: boolean;
  hasWords?: boolean;
  hasGroups?: boolean;
  verified?: boolean;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  wordsLearnedMin?: number;
  wordsLearnedMax?: number;
}