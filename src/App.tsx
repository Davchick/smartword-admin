import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminFetch } from './api';
import { Modal } from './components/Modal';
import { OverviewTab } from './features/OverviewTab';
import { UsersTab } from './features/UsersTab';
import { AuditTab, ConsentsTab, PaymentsTab } from './features/DataTableTabs';
import { UserDetailPanel } from './features/UserDetailPanel';
import type {
  AdminAuditResponse,
  AdminOverview,
  AdminTab,
  AdminUserDetail,
  AdminUsersResponse,
  ConsentsResponse,
  PaymentsResponse,
} from './types';

const NAV_ITEMS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'users', label: 'Users', icon: '◎' },
  { id: 'payments', label: 'Payments', icon: '◈' },
  { id: 'consents', label: 'Consents', icon: '◇' },
  { id: 'audit', label: 'Audit', icon: '▣' },
];

export default function App() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loadingByTab, setLoadingByTab] = useState<Record<AdminTab, boolean>>({
    overview: false,
    users: false,
    payments: false,
    consents: false,
    audit: false,
  });
  const [error, setError] = useState('');
  const [mutationBusy, setMutationBusy] = useState(false);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUsersResponse | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [payments, setPayments] = useState<PaymentsResponse | null>(null);
  const [consents, setConsents] = useState<ConsentsResponse | null>(null);
  const [audit, setAudit] = useState<AdminAuditResponse | null>(null);
  const [search, setSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [grantModalUserId, setGrantModalUserId] = useState<string | null>(null);
  const [grantDurationDays, setGrantDurationDays] = useState('30');
  const [grantPlanId, setGrantPlanId] = useState('manual');
  const requestsRef = useRef<Record<string, AbortController>>({});

  const config = useMemo(() => ({ token, email }), [token, email]);

  function setTabLoading(activeTab: AdminTab, isLoading: boolean) {
    setLoadingByTab((prev) => ({ ...prev, [activeTab]: isLoading }));
  }

  function withAbortableKey(key: string): AbortController {
    requestsRef.current[key]?.abort();
    const controller = new AbortController();
    requestsRef.current[key] = controller;
    return controller;
  }

  const loadCurrentTabData = useCallback(async (activeTab: AdminTab) => {
    setTabLoading(activeTab, true);
    setError('');
    try {
      if (activeTab === 'overview') {
        const controller = withAbortableKey('overview');
        setOverview(await adminFetch<AdminOverview>('/overview', config, { signal: controller.signal }));
      }
      if (activeTab === 'users') {
        const controller = withAbortableKey('users');
        setUsers(await adminFetch<AdminUsersResponse>(
          `/users?page=${usersPage}&pageSize=20&search=${encodeURIComponent(search)}`,
          config,
          { signal: controller.signal },
        ));
      }
      if (activeTab === 'payments') {
        const controller = withAbortableKey('payments');
        setPayments(await adminFetch<PaymentsResponse>('/payments?limit=100', config, { signal: controller.signal }));
      }
      if (activeTab === 'consents') {
        const controller = withAbortableKey('consents');
        setConsents(await adminFetch<ConsentsResponse>('/consents?limit=100', config, { signal: controller.signal }));
      }
      if (activeTab === 'audit') {
        const controller = withAbortableKey('audit');
        setAudit(await adminFetch<AdminAuditResponse>('/audit?limit=100', config, { signal: controller.signal }));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTabLoading(activeTab, false);
    }
  }, [config, search, usersPage]);

  useEffect(() => {
    if (!isAuthorized) return;
    void loadCurrentTabData(tab);
  }, [tab, isAuthorized, loadCurrentTabData]);

  useEffect(() => {
    const activeControllers = requestsRef.current;
    return () => {
      Object.values(activeControllers).forEach((controller) => controller.abort());
    };
  }, []);

  const onAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token.trim() || !email.trim()) {
      setError('Enter admin token and admin email.');
      return;
    }
    setIsAuthorized(true);
  };

  const onSearchUsers = async (event: FormEvent) => {
    event.preventDefault();
    if (!isAuthorized) return;
    setUsersPage(1);
    setTab('users');
    if (tab === 'users') {
      await loadCurrentTabData('users');
    }
  };

  const openUser = async (userId: string) => {
    try {
      setOpenUserId(userId);
      setError('');
      const controller = withAbortableKey('user-detail');
      setUserDetail(await adminFetch<AdminUserDetail>(`/users/${userId}`, config, { signal: controller.signal }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setOpenUserId(null);
    }
  };

  const closeUserDetail = () => setUserDetail(null);

  const grantSubscription = async (event: FormEvent) => {
    event.preventDefault();
    if (!grantModalUserId) return;
    const durationDays = Number(grantDurationDays);
    const planId = grantPlanId.trim();
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 3650) {
      setError('Duration days must be between 1 and 3650.');
      return;
    }
    if (!planId) {
      setError('Plan id is required.');
      return;
    }
    try {
      setMutationBusy(true);
      await adminFetch(`/users/${grantModalUserId}/subscription`, config, {
        method: 'PATCH',
        body: JSON.stringify({ duration_days: durationDays, plan_id: planId }),
      });
      await openUser(grantModalUserId);
      await loadCurrentTabData('users');
      await loadCurrentTabData('audit');
      setGrantModalUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setMutationBusy(false);
    }
  };

  const resetWeeklyLimit = async (userId: string) => {
    try {
      setMutationBusy(true);
      await adminFetch(`/users/${userId}/reset-weekly-limit`, config, { method: 'POST' });
      await openUser(userId);
      await loadCurrentTabData('users');
      await loadCurrentTabData('audit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset weekly limit');
    } finally {
      setMutationBusy(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Admin Access</h2>
          <p>Sign in to your admin console</p>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={onAuthSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="admin@example.com"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="token">API Token</label>
              <input
                id="token"
                className="form-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type="password"
                placeholder="Enter your admin token"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          SmartWord
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="text-sm text-muted">{email}</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <h1>{NAV_ITEMS.find((n) => n.id === tab)?.label ?? 'Admin'}</h1>
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={() => void loadCurrentTabData(tab)}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {tab === 'overview' && <OverviewTab overview={overview} isLoading={loadingByTab.overview} />}
        {tab === 'users' && (
          <UsersTab
            users={users}
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={onSearchUsers}
            onPageChange={setUsersPage}
            onOpenUser={openUser}
            isLoading={loadingByTab.users}
            openUserId={openUserId}
          />
        )}
        {tab === 'payments' && <PaymentsTab data={payments} isLoading={loadingByTab.payments} />}
        {tab === 'consents' && <ConsentsTab data={consents} isLoading={loadingByTab.consents} />}
        {tab === 'audit' && <AuditTab data={audit} isLoading={loadingByTab.audit} />}
      </main>

      {userDetail && (
        <UserDetailPanel
          userDetail={userDetail}
          onClose={closeUserDetail}
          onGrantSubscription={(userId) => setGrantModalUserId(userId)}
          onResetWeeklyLimit={resetWeeklyLimit}
          mutationBusy={mutationBusy}
        />
      )}

      {grantModalUserId && (
        <Modal
          title="Grant Subscription"
          confirmLabel="Apply"
          onCancel={() => setGrantModalUserId(null)}
          onConfirm={grantSubscription}
          isBusy={mutationBusy}
          isConfirmDisabled={!grantPlanId.trim() || !grantDurationDays.trim()}
        >
          <div className="form-group">
            <label htmlFor="duration">Duration (days)</label>
            <input
              id="duration"
              className="form-input"
              value={grantDurationDays}
              onChange={(e) => setGrantDurationDays(e.target.value)}
              type="number"
              min={1}
              max={3650}
            />
          </div>
          <div className="form-group">
            <label htmlFor="planId">Plan ID</label>
            <input
              id="planId"
              className="form-input"
              value={grantPlanId}
              onChange={(e) => setGrantPlanId(e.target.value)}
              placeholder="manual"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}