import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Users, CreditCard, FileText, Search, MessageSquare, Bug } from 'lucide-react';

import { useAdminAuth, useGlobalSearch } from './hooks/useAdminAuth';
import { useAdminData } from './hooks/useAdminData';
import { useAdminMutations } from './hooks/useAdminMutations';
import { useAdminUI, Toast } from './hooks/useAdminUI';
import { OverviewTab } from './features/OverviewTab';
import { UsersTab } from './features/UsersTab';
import { AuditTab, ConsentsTab, PaymentsTab } from './features/DataTableTabs';
import { TicketsTab, ErrorLogsTab } from './features/SupportTabs';
import { UserDetailPanel } from './features/UserDetailPanel';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import type { AdminTab } from './types';

const NAV_ITEMS: { id: AdminTab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Обзор', Icon: LayoutDashboard },
  { id: 'users', label: 'Пользователи', Icon: Users },
  { id: 'payments', label: 'Платежи', Icon: CreditCard },
  { id: 'consents', label: 'Согласия', Icon: FileText },
  { id: 'audit', label: 'Аудит', Icon: Search },
  { id: 'tickets', label: 'Поддержка', Icon: MessageSquare },
  { id: 'errorLogs', label: 'Ошибки', Icon: Bug },
];

const STORAGE_TAB_KEY = 'adminTab';

function saveStoredTab(tab: AdminTab): void {
  try {
    localStorage.setItem(STORAGE_TAB_KEY, tab);
  } catch {
    // ignore
  }
}

export default function App() {
  const { email, token, isAuthorized, login, logout } = useAdminAuth();
  const config = useMemo(() => ({ token, email }), [token, email]);
  const {
    tab,
    setTab,
    period,
    setPeriod,
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
  } = useAdminData({ config, defaultPeriod: '30d' });
  const { isBusy: mutationBusy, lastError, updateUserEmail, grantSubscription, resetWeeklyLimit, bulkGrantSubscription } = useAdminMutations(config);
  const { isSearchOpen, openSearch, closeSearch, toasts, showSuccess, showError, removeToast } = useAdminUI({
    defaultTab: 'overview',
  });
  const { query, setQuery, results, isLoading: searchLoading, error: searchError, search: performSearch, searchType, setSearchType } = useGlobalSearch(config);

  const [search, setSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize] = useState(20);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [grantModalUserId, setGrantModalUserId] = useState<string | null>(null);
  const [grantDurationDays, setGrantDurationDays] = useState('30');
  const [grantPlanId, setGrantPlanId] = useState('manual');

  const [usersFilters, setUsersFilters] = useState<{
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
}>({});
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsStatus, setPaymentsStatus] = useState<string | undefined>();
  const [consentsPage, setConsentsPage] = useState(1);
  const [consentsSearch, setConsentsSearch] = useState('');
  const [consentsType, setConsentsType] = useState<string | undefined>();
  const [consentsGranted, setConsentsGranted] = useState<boolean | undefined>();
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState<string | undefined>();
  const [auditOutcome, setAuditOutcome] = useState<string | undefined>();
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [ticketsStatus, setTicketsStatus] = useState<string | undefined>();
  const [ticketsPriority, setTicketsPriority] = useState<string | undefined>();
  const [errorLogsPage, setErrorLogsPage] = useState(1);
  const [errorLogsSearch, setErrorLogsSearch] = useState('');
  const [errorLogsType, setErrorLogsType] = useState<string | undefined>();
  const [errorLogsResolved, setErrorLogsResolved] = useState<boolean | undefined>();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<Array<{ id: string; name: string; filters: typeof usersFilters }>>([]);
  const [, setOverviewFilter] = useState<{ type: 'premium' | 'verified' | 'new'; value?: boolean } | null>(null);

  useEffect(() => {
    saveStoredTab(tab);
  }, [tab]);

  useEffect(() => {
    if (!isAuthorized) return;
    void loadCurrentTab();
  }, [tab, isAuthorized, loadCurrentTab]);

  useEffect(() => {
    if (!isAuthorized || tab !== 'overview') return;
    void fetchOverview(period);
    setLastRefreshed(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, isAuthorized, tab]);

  useEffect(() => {
    if (!isAuthorized || tab !== 'payments') return;
    void fetchPayments(paymentsPage, 20, period, paymentsSearch || undefined, paymentsStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthorized, paymentsPage, period, paymentsSearch, paymentsStatus]);

  useEffect(() => {
    if (!isAuthorized || tab !== 'consents') return;
    void fetchConsents(consentsPage, 20, period, consentsSearch || undefined, consentsType, consentsGranted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthorized, consentsPage, period, consentsSearch, consentsType, consentsGranted]);

  useEffect(() => {
    if (!isAuthorized || tab !== 'audit') return;
    void fetchAudit(auditPage, 20, period, auditSearch || undefined, auditAction, auditOutcome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthorized, auditPage, period, auditSearch, auditAction, auditOutcome]);

  useEffect(() => {
    if (!isAuthorized || tab !== 'tickets') return;
    void fetchTickets(ticketsPage, 20, period, ticketsSearch || undefined, ticketsStatus, ticketsPriority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthorized, ticketsPage, period, ticketsSearch, ticketsStatus, ticketsPriority]);

  useEffect(() => {
    if (!isAuthorized || tab !== 'errorLogs') return;
    void fetchErrorLogs(errorLogsPage, 20, period, errorLogsSearch || undefined, errorLogsType, errorLogsResolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthorized, errorLogsPage, period, errorLogsSearch, errorLogsType, errorLogsResolved]);

  useEffect(() => {
    if (!autoRefresh || !isAuthorized) return;
    const interval = setInterval(() => {
      void loadCurrentTab(true);
      setLastRefreshed(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAuthorized, loadCurrentTab]);

  const handleTabChange = useCallback((newTab: AdminTab) => {
    setTab(newTab);
    setOverviewFilter(null);
  }, [setTab]);

  const handleOverviewMetricClick = useCallback((filter: { type: 'premium' | 'verified' | 'new'; value?: boolean }) => {
    setOverviewFilter(filter);
    setTab('users');
    if (filter.type === 'premium') {
      setUsersFilters((prev) => ({ ...prev, isPremium: filter.value ?? true }));
    } else {
      setUsersFilters({});
    }
  }, [setTab]);

  const handleSearchUsers = useCallback(async (event?: React.FormEvent) => {
    event?.preventDefault();
    setUsersPage(1);
    await fetchUsers(1, usersPageSize, search, usersFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsers, search, usersPageSize]);

  const handleUsersPageChange = useCallback(async (page: number) => {
    setUsersPage(page);
    await fetchUsers(page, usersPageSize, search, usersFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsers, search, usersPageSize]);

  const handleUsersFiltersChange = useCallback(async (filters: typeof usersFilters) => {
    setUsersFilters(filters);
    setUsersPage(1);
    await fetchUsers(1, usersPageSize, search, filters);
  }, [fetchUsers, search, usersPageSize]);

  const handleSelectUser = useCallback((userId: string, selected: boolean) => {
    setSelectedUsers((prev) => {
      if (selected) {
        return prev.includes(userId) ? prev : [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  }, []);

  const handleSelectAllUsers = useCallback((selected: boolean) => {
    if (selected && users.data?.users) {
      const allIds = users.data.users.map((u) => u.id);
      setSelectedUsers(allIds);
    } else {
      setSelectedUsers([]);
    }
  }, [users.data]);

  const handleBulkGrantSubscription = useCallback(async (userIds: string[]) => {
    const durationDays = Number(grantDurationDays);
    const planId = grantPlanId.trim();
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 3650) {
      showError('Длительность должна быть от 1 до 3650 дней.');
      return;
    }
    const result = await bulkGrantSubscription(userIds, durationDays, planId);
    if (result) {
      showSuccess(`Выдано подписок: ${result.succeeded}/${result.total}`);
      if (result.failed > 0) {
        showError(`Не удалось: ${result.failed}`);
      }
      setSelectedUsers([]);
      void fetchUsers(usersPage, usersPageSize, search, usersFilters);
    } else if (lastError) {
      showError(lastError);
    }
  }, [bulkGrantSubscription, grantDurationDays, grantPlanId, fetchUsers, usersPage, usersPageSize, search, usersFilters, lastError, showError, showSuccess]);

  const handleSaveFilter = useCallback((name: string) => {
    const newFilter = { id: `filter-${Date.now()}`, name, filters: { ...usersFilters } };
    setSavedFilters((prev) => [...prev, newFilter]);
    showSuccess(`Фильтр "${name}" сохранён`);
  }, [usersFilters, showSuccess]);

  const handleLoadFilter = useCallback((id: string) => {
    const filter = savedFilters.find((f) => f.id === id);
    if (filter) {
      setUsersFilters(filter.filters);
      setUsersPage(1);
      void fetchUsers(1, usersPageSize, search, filter.filters);
    }
  }, [savedFilters, fetchUsers, search, usersPageSize]);

  const handleDeleteFilter = useCallback((id: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const openUser = useCallback(async (userId: string) => {
    setOpenUserId(userId);
    await fetchUserDetail(userId);
  }, [fetchUserDetail]);

  const closeUserDetail = useCallback(() => {
    setOpenUserId(null);
  }, []);

  const handleFetchUserWords = useCallback((userId: string, page = 1, searchQuery?: string) => {
    void fetchUserWords(userId, page, 20, searchQuery);
  }, [fetchUserWords]);

  const handleFetchUserGroups = useCallback((userId: string, page = 1, searchQuery?: string) => {
    void fetchUserGroups(userId, page, 20, searchQuery);
  }, [fetchUserGroups]);

  const handleFetchUserPayments = useCallback((userId: string, page = 1) => {
    void fetchUserPayments(userId, page, 20);
  }, [fetchUserPayments]);

  const grantSubscriptionHandler = useCallback(async (userId: string) => {
    const durationDays = Number(grantDurationDays);
    const planId = grantPlanId.trim();
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 3650) {
      showError('Длительность должна быть от 1 до 3650 дней.');
      return;
    }
    if (!planId) {
      showError('Выберите тариф.');
      return;
    }

    const result = await grantSubscription(userId, durationDays, planId);
    if (result) {
      showSuccess(`Подписка выдана на ${durationDays} дней`);
      await openUser(userId);
      void fetchUsers(usersPage, usersPageSize, search, usersFilters);
      void fetchAudit();
    } else if (lastError) {
      showError(lastError);
    }
  }, [grantDurationDays, grantPlanId, grantSubscription, openUser, fetchUsers, fetchAudit, usersPage, usersPageSize, search, usersFilters, lastError, showError, showSuccess]);

  const resetWeeklyLimitHandler = useCallback(async (userId: string) => {
    const success = await resetWeeklyLimit(userId);
    if (success) {
      showSuccess('Недельный лимит сброшен');
      await openUser(userId);
      void fetchUsers(usersPage, usersPageSize, search, usersFilters);
      void fetchAudit();
    } else if (lastError) {
      showError(lastError);
    }
  }, [resetWeeklyLimit, openUser, fetchUsers, fetchAudit, usersPage, usersPageSize, search, usersFilters, lastError, showError, showSuccess]);

  const handleGlobalSearchSelect = useCallback(async (userId: string) => {
    setTab('users');
    await openUser(userId);
    closeSearch();
  }, [setTab, openUser, closeSearch]);

  const handleUpdateEmail = useCallback(async (userId: string, email: string) => {
    const result = await updateUserEmail(userId, email);
    if (result) {
      showSuccess(`Email изменён на ${email}`);
      await openUser(userId);
      void fetchUsers(usersPage, usersPageSize, search, usersFilters);
      void fetchAudit();
    } else if (lastError) {
      showError(lastError);
      throw new Error(lastError);
    }
  }, [updateUserEmail, openUser, fetchUsers, fetchAudit, usersPage, usersPageSize, search, usersFilters, lastError, showError, showSuccess]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
      return;
    }

    if (e.key === 'Escape') {
      if (openUserId) {
        setOpenUserId(null);
        return;
      }
      if (isSearchOpen) {
        closeSearch();
        return;
      }
      if (grantModalUserId) {
        setGrantModalUserId(null);
        return;
      }
      return;
    }

    const tabs: AdminTab[] = ['overview', 'users', 'payments', 'consents', 'audit'];
    const number = parseInt(e.key, 10);
    if (number >= 1 && number <= 5 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const target = document.activeElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (!isInput) {
        e.preventDefault();
        setTab(tabs[number - 1]);
      }
    }
  }, [openSearch, openUserId, isSearchOpen, grantModalUserId, closeSearch, setTab]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isAuthorized) {
    return <AuthForm onLogin={login} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={tab}
        onTabChange={handleTabChange}
        onLogout={logout}
        onOpenSearch={openSearch}
      />

      <main className="main-content">
        <TopBar
          title={NAV_ITEMS.find((n) => n.id === tab)?.label ?? 'Admin'}
          onRefresh={() => { void loadCurrentTab(true); setLastRefreshed(new Date()); }}
          lastRefreshed={lastRefreshed}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
        />

        {tab === 'overview' && (
          <OverviewTab
            overview={overview.data}
            isLoading={overview.isLoading}
            period={period}
            onPeriodChange={setPeriod}
            config={config}
            onMetricClick={handleOverviewMetricClick}
          />
        )}

        {tab === 'users' && (
          <UsersTab
            users={users.data}
            search={search}
            filters={usersFilters}
            onSearchChange={setSearch}
            onSearchSubmit={handleSearchUsers}
            onFiltersChange={handleUsersFiltersChange}
            onPageChange={handleUsersPageChange}
            onOpenUser={openUser}
            isLoading={users.isLoading}
            openUserId={openUserId}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAllUsers}
            onBulkGrantSubscription={handleBulkGrantSubscription}
            onSaveFilter={handleSaveFilter}
            savedFilters={savedFilters.map((f) => ({ id: f.id, name: f.name }))}
            onLoadFilter={handleLoadFilter}
            onDeleteFilter={handleDeleteFilter}
          />
        )}

        {tab === 'payments' && (
          <PaymentsTab
            data={payments.data}
            isLoading={payments.isLoading}
            period={period}
            onPeriodChange={setPeriod}
            onPageChange={setPaymentsPage}
            onSearch={setPaymentsSearch}
            onStatusFilter={setPaymentsStatus}
          />
        )}

        {tab === 'consents' && (
          <ConsentsTab
            data={consents.data}
            isLoading={consents.isLoading}
            period={period}
            onPeriodChange={setPeriod}
            onPageChange={setConsentsPage}
            onSearch={setConsentsSearch}
            onTypeFilter={setConsentsType}
            onGrantedFilter={setConsentsGranted}
          />
        )}

        {tab === 'audit' && (
          <AuditTab
            data={audit.data}
            isLoading={audit.isLoading}
            period={period}
            onPeriodChange={setPeriod}
            onPageChange={setAuditPage}
            onSearch={setAuditSearch}
            onActionFilter={setAuditAction}
            onOutcomeFilter={setAuditOutcome}
          />
        )}

        {tab === 'tickets' && (
          <TicketsTab
            data={tickets.data}
            isLoading={tickets.isLoading}
            period={period}
            onPeriodChange={setPeriod}
            onPageChange={setTicketsPage}
            onSearch={setTicketsSearch}
            onStatusFilter={setTicketsStatus}
            onPriorityFilter={setTicketsPriority}
          />
        )}

        {tab === 'errorLogs' && (
          <ErrorLogsTab
            data={errorLogs.data}
            isLoading={errorLogs.isLoading}
            period={period}
            onPeriodChange={setPeriod}
            onPageChange={setErrorLogsPage}
            onSearch={setErrorLogsSearch}
            onTypeFilter={setErrorLogsType}
            onResolvedFilter={setErrorLogsResolved}
          />
        )}
      </main>

      {userDetail.data && (
        <UserDetailPanel
          userDetail={userDetail.data}
          userWords={userWords.data}
          userGroups={userGroups.data}
          userPayments={userPayments.data}
          wordsLoading={userWords.isLoading}
          groupsLoading={userGroups.isLoading}
          paymentsLoading={userPayments.isLoading}
          onClose={closeUserDetail}
          onGrantSubscription={(userId) => setGrantModalUserId(userId)}
          onResetWeeklyLimit={resetWeeklyLimitHandler}
          onUpdateEmail={handleUpdateEmail}
          onFetchWords={handleFetchUserWords}
          onFetchGroups={handleFetchUserGroups}
          onFetchPayments={handleFetchUserPayments}
          mutationBusy={mutationBusy}
        />
      )}

      {grantModalUserId && (
        <SubscriptionModal
          duration={grantDurationDays}
          planId={grantPlanId}
          onDurationChange={setGrantDurationDays}
          onPlanIdChange={setGrantPlanId}
          onConfirm={() => grantSubscriptionHandler(grantModalUserId)}
          onCancel={() => setGrantModalUserId(null)}
        />
      )}

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelectUser={handleGlobalSearchSelect}
        query={query}
        setQuery={setQuery}
        results={results}
        isLoading={searchLoading}
        error={searchError}
        onSearch={performSearch}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

interface AuthFormProps {
  onLogin: (email: string, token: string) => void;
}

function AuthForm({ onLogin }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !email.trim()) {
      setError('Введите токен и email.');
      return;
    }
    onLogin(email, token);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Админ-панель</h2>
        <p>Вход в панель управления</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="token">API токен</label>
            <input
              id="token"
              className="form-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="Введите API токен"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onOpenSearch: () => void;
}

function Sidebar({ activeTab, onTabChange, onLogout, onOpenSearch }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">S</div>
        SmartWord
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-item-icon">
              <item.Icon size={18} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-search-hint">
        <button type="button" className="btn btn-ghost" onClick={onOpenSearch}>
          <Search size={16} />
          <span>Поиск</span>
          <kbd>⌘K</kbd>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="keyboard-hints">
          <span><kbd>1-5</kbd> табы</span>
          <span><kbd>Esc</kbd> закрыть</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onLogout}>
          Выйти
        </button>
      </div>
    </aside>
  );
}

interface TopBarProps {
  title: string;
  onRefresh: () => void;
  lastRefreshed: Date | null;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

function TopBar({ title, onRefresh, lastRefreshed, autoRefresh, onToggleAutoRefresh }: TopBarProps) {
  const formatTime = (date: Date) => date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div className="topbar-actions">
        {lastRefreshed && (
          <span className="last-refreshed">
            Обновлено: {formatTime(lastRefreshed)}
          </span>
        )}
        <button
          type="button"
          className={`btn btn-ghost ${autoRefresh ? 'active' : ''}`}
          onClick={onToggleAutoRefresh}
          title="Автообновление (каждые 60 сек)"
        >
          🔄 {autoRefresh ? 'Вкл' : 'Выкл'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRefresh}>
          ↻ Обновить
        </button>
      </div>
    </div>
  );
}

interface SubscriptionModalProps {
  duration: string;
  planId: string;
  onDurationChange: (value: string) => void;
  onPlanIdChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function SubscriptionModal({
  duration,
  planId,
  onDurationChange,
  onPlanIdChange,
  onConfirm,
  onCancel,
}: SubscriptionModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Выдать подписку</h3>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="duration">Длительность (дней)</label>
            <select
              id="duration"
              className="form-input"
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
            >
              <option value="7">7 дней</option>
              <option value="30">30 дней</option>
              <option value="90">90 дней</option>
              <option value="180">180 дней</option>
              <option value="365">365 дней</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="planId">Тариф</label>
            <select
              id="planId"
              className="form-input"
              value={planId}
              onChange={(e) => onPlanIdChange(e.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Выдать
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => onRemove(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}