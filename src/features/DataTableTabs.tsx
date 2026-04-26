import { useCallback, useState } from 'react';
import type { Period } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    active: 'Активен',
    success: 'Успешно',
    completed: 'Завершён',
    granted: 'Выдан',
    failed: 'Ошибка',
    denied: 'Отклонён',
  };
  const isActive = status === 'active' || status === 'success' || status === 'completed' || status === 'granted';
  return <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>{label[status] || status}</span>;
}

interface PeriodFilterProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
}

function PeriodFilter({ period, onPeriodChange }: PeriodFilterProps) {
  return (
    <div className="period-filter">
      <button
        type="button"
        className={`period-btn ${period === '7d' ? 'active' : ''}`}
        onClick={() => onPeriodChange('7d')}
      >
        7 дней
      </button>
      <button
        type="button"
        className={`period-btn ${period === '30d' ? 'active' : ''}`}
        onClick={() => onPeriodChange('30d')}
      >
        30 дней
      </button>
      <button
        type="button"
        className={`period-btn ${period === '90d' ? 'active' : ''}`}
        onClick={() => onPeriodChange('90d')}
      >
        90 дней
      </button>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, total, isLoading, onPageChange }: PaginationProps) {
  return (
    <div className="pagination">
      <span className="pagination-info">
        Страница {page} из {totalPages} · {total.toLocaleString()} записей
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          ← Назад
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

export function PaymentsTab({
  data,
  isLoading,
  period = '30d',
  onPeriodChange,
  onPageChange,
  onSearch,
  onStatusFilter,
}: {
  data: {
    page: number;
    page_size: number;
    total: number;
    payments: Array<{ id: string; user_id: string; user_email: string | null; plan_id: string; amount: number | null; status: string; created_at: string }>;
  } | null;
  isLoading: boolean;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string | undefined) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(search);
  }, [search, onSearch]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatus(value);
    onStatusFilter?.(value || undefined);
  }, [onStatusFilter]);

  const page = data?.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div>
      {onPeriodChange && <PeriodFilter period={period} onPeriodChange={onPeriodChange} />}
      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            className="form-input filter-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ID или email..."
          />
          <button type="submit" className="btn btn-primary btn-sm">Найти</button>
        </form>
        <select className="filter-select" value={status} onChange={handleStatusChange}>
          <option value="">Все статусы</option>
          <option value="succeeded">Успешно</option>
          <option value="pending">Ожидание</option>
          <option value="failed">Ошибка</option>
          <option value="canceled">Отменён</option>
        </select>
      </div>
      <div className="table-container">
        {isLoading && <div className="loading-state">Загрузка платежей...</div>}
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Email</th>
              <th>Тариф</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {data?.payments.length ? data.payments.map((item) => (
              <tr key={item.id}>
                <td className="text-muted">{formatDate(item.created_at)}</td>
                <td className="text-muted">{item.user_email ?? item.user_id}</td>
                <td>{item.plan_id}</td>
                <td>{item.amount ? `${item.amount} ₽` : '—'}</td>
                <td><StatusBadge status={item.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="empty-state">Нет платежей</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > 0 && onPageChange && (
          <Pagination page={page} totalPages={totalPages} total={data.total} isLoading={isLoading} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}

export function ConsentsTab({
  data,
  isLoading,
  period = '30d',
  onPeriodChange,
  onPageChange,
  onSearch,
  onTypeFilter,
  onGrantedFilter,
}: {
  data: {
    page: number;
    page_size: number;
    total: number;
    consents: Array<{ id: string; user_id: string | null; email: string | null; consent_type: string; policy_version: string; granted: boolean; ip_address: string; created_at: string }>;
  } | null;
  isLoading: boolean;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onTypeFilter?: (consentType: string | undefined) => void;
  onGrantedFilter?: (granted: boolean | undefined) => void;
}) {
  const [search, setSearch] = useState('');
  const [consentType, setConsentType] = useState('');
  const [granted, setGranted] = useState('');

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(search);
  }, [search, onSearch]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setConsentType(value);
    onTypeFilter?.(value || undefined);
  }, [onTypeFilter]);

  const handleGrantedChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setGranted(value);
    onGrantedFilter?.(value === '' ? undefined : value === 'true');
  }, [onGrantedFilter]);

  const page = data?.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div>
      {onPeriodChange && <PeriodFilter period={period} onPeriodChange={onPeriodChange} />}
      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            className="form-input filter-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email или IP..."
          />
          <button type="submit" className="btn btn-primary btn-sm">Найти</button>
        </form>
        <select className="filter-select" value={consentType} onChange={handleTypeChange}>
          <option value="">Все типы</option>
          <option value="terms">Terms</option>
          <option value="privacy">Privacy</option>
          <option value="marketing">Marketing</option>
        </select>
        <select className="filter-select" value={granted} onChange={handleGrantedChange}>
          <option value="">Все</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
      </div>
      <div className="table-container">
        {isLoading && <div className="loading-state">Загрузка согласий...</div>}
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Email</th>
              <th>Тип</th>
              <th>Политика</th>
              <th>Статус</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.consents.length ? data.consents.map((item) => (
              <tr key={item.id}>
                <td className="text-muted">{formatDate(item.created_at)}</td>
                <td className="text-muted">{item.email ?? '—'}</td>
                <td>{item.consent_type}</td>
                <td className="text-muted">{item.policy_version}</td>
                <td><StatusBadge status={item.granted ? 'granted' : 'denied'} /></td>
                <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{item.ip_address}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="empty-state">Нет согласий</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > 0 && onPageChange && (
          <Pagination page={page} totalPages={totalPages} total={data.total} isLoading={isLoading} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}

export function AuditTab({
  data,
  isLoading,
  period = '30d',
  onPeriodChange,
  onPageChange,
  onSearch,
  onActionFilter,
  onOutcomeFilter,
}: {
  data: {
    page: number;
    page_size: number;
    total: number;
    items: Array<{ id: string; admin_email: string | null; action: string; target_type: string; target_id: string | null; outcome: string; ip_address: string | null; created_at: string }>;
  } | null;
  isLoading: boolean;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onActionFilter?: (action: string | undefined) => void;
  onOutcomeFilter?: (outcome: string | undefined) => void;
}) {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(search);
  }, [search, onSearch]);

  const handleActionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAction(value);
    onActionFilter?.(value || undefined);
  }, [onActionFilter]);

  const handleOutcomeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setOutcome(value);
    onOutcomeFilter?.(value || undefined);
  }, [onOutcomeFilter]);

  const page = data?.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div>
      {onPeriodChange && <PeriodFilter period={period} onPeriodChange={onPeriodChange} />}
      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            className="form-input filter-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по админу или действию..."
          />
          <button type="submit" className="btn btn-primary btn-sm">Найти</button>
        </form>
        <select className="filter-select" value={action} onChange={handleActionChange}>
          <option value="">Все действия</option>
          <option value="update_user_email">Изменение email</option>
          <option value="grant_subscription">Выдача подписки</option>
          <option value="reset_weekly_limit">Сброс лимита</option>
        </select>
        <select className="filter-select" value={outcome} onChange={handleOutcomeChange}>
          <option value="">Все результаты</option>
          <option value="success">Успешно</option>
          <option value="error">Ошибка</option>
        </select>
      </div>
      <div className="table-container">
        {isLoading && <div className="loading-state">Загрузка аудита...</div>}
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Админ</th>
              <th>Действие</th>
              <th>Объект</th>
              <th>Результат</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.length ? data.items.map((item) => (
              <tr key={item.id}>
                <td className="text-muted">{formatDate(item.created_at)}</td>
                <td className="text-muted">{item.admin_email ?? '—'}</td>
                <td style={{ fontWeight: 500 }}>{item.action}</td>
                <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  {item.target_type}:{item.target_id ?? '—'}
                </td>
                <td><StatusBadge status={item.outcome} /></td>
                <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{item.ip_address ?? '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="empty-state">Нет записей</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > 0 && onPageChange && (
          <Pagination page={page} totalPages={totalPages} total={data.total} isLoading={isLoading} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}