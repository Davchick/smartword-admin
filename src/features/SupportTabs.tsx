import { useCallback, useState } from 'react';
import type { Period, TicketsResponse, ErrorLogsResponse } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
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
        >
          Назад
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Далее
        </button>
      </div>
    </div>
  );
}

interface TicketsTabProps {
  data: TicketsResponse | null;
  isLoading: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onPageChange: (page: number) => void;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string | undefined) => void;
  onPriorityFilter: (value: string | undefined) => void;
}

export function TicketsTab({
  data,
  isLoading,
  period,
  onPeriodChange,
  onPageChange,
  onSearch,
  onStatusFilter,
  onPriorityFilter,
}: TicketsTabProps) {
  const [search, setSearch] = useState('');
  const [localStatus, setLocalStatus] = useState<string>('');
  const [localPriority, setLocalPriority] = useState<string>('');

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  const handleSearch = useCallback(() => {
    onSearch(search);
  }, [search, onSearch]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalStatus(value);
    onStatusFilter(value || undefined);
  }, [onStatusFilter]);

  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalPriority(value);
    onPriorityFilter(value || undefined);
  }, [onPriorityFilter]);

  return (
    <div>
      <div className="tab-header">
        <div className="search-bar">
          <input
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Поиск по email, теме, сообщению..."
          />
          <button type="button" className="btn btn-primary" onClick={handleSearch}>
            Найти
          </button>
        </div>
        <PeriodFilter period={period} onPeriodChange={onPeriodChange} />
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Статус:</label>
          <select className="filter-select" value={localStatus} onChange={handleStatusChange}>
            <option value="">Все</option>
            <option value="open">Открыт</option>
            <option value="in_progress">В работе</option>
            <option value="resolved">Решён</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Приоритет:</label>
          <select className="filter-select" value={localPriority} onChange={handlePriorityChange}>
            <option value="">Все</option>
            <option value="low">Низкий</option>
            <option value="normal">Обычный</option>
            <option value="high">Высокий</option>
            <option value="urgent">Срочный</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {isLoading && <div className="loading-state">Загрузка тикетов...</div>}
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Email</th>
              <th>Тема</th>
              <th>Статус</th>
              <th>Приоритет</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {data?.tickets.length ? data.tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="text-muted">{formatDate(ticket.created_at)}</td>
                <td style={{ fontWeight: 500 }}>{ticket.email}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.subject}
                </td>
                <td>
                  <span className={`status-badge ${ticket.status === 'open' ? 'active' : ticket.status === 'resolved' ? 'success' : ''}`}>
                    {ticket.status === 'open' ? 'Открыт' : ticket.status === 'in_progress' ? 'В работе' : ticket.status === 'resolved' ? 'Решён' : ticket.status === 'closed' ? 'Закрыт' : ticket.status}
                  </span>
                </td>
                <td>
                  <span className={`priority-badge ${ticket.priority}`}>
                    {ticket.priority === 'low' ? 'Низкий' : ticket.priority === 'normal' ? 'Обычный' : ticket.priority === 'high' ? 'Высокий' : ticket.priority === 'urgent' ? 'Срочный' : ticket.priority}
                  </span>
                </td>
                <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {ticket.id.slice(0, 8)}...
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="empty-state">Нет тикетов</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={totalPages} total={data.total} isLoading={isLoading} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}

interface ErrorLogsTabProps {
  data: ErrorLogsResponse | null;
  isLoading: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onPageChange: (page: number) => void;
  onSearch: (value: string) => void;
  onTypeFilter: (value: string | undefined) => void;
  onResolvedFilter: (value: boolean | undefined) => void;
}

export function ErrorLogsTab({
  data,
  isLoading,
  period,
  onPeriodChange,
  onPageChange,
  onSearch,
  onTypeFilter,
  onResolvedFilter,
}: ErrorLogsTabProps) {
  const [search, setSearch] = useState('');
  const [localType, setLocalType] = useState<string>('');
  const [localResolved, setLocalResolved] = useState<string>('');

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  const handleSearch = useCallback(() => {
    onSearch(search);
  }, [search, onSearch]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalType(value);
    onTypeFilter(value || undefined);
  }, [onTypeFilter]);

  const handleResolvedChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalResolved(value);
    onResolvedFilter(value === '' ? undefined : value === 'true');
  }, [onResolvedFilter]);

  return (
    <div>
      <div className="tab-header">
        <div className="search-bar">
          <input
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Поиск по типу ошибки, сообщению..."
          />
          <button type="button" className="btn btn-primary" onClick={handleSearch}>
            Найти
          </button>
        </div>
        <PeriodFilter period={period} onPeriodChange={onPeriodChange} />
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Тип:</label>
          <select className="filter-select" value={localType} onChange={handleTypeChange}>
            <option value="">Все</option>
            <option value="network">Network</option>
            <option value="runtime">Runtime</option>
            <option value="render">Render</option>
            <option value="auth">Auth</option>
            <option value="api">API</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Статус:</label>
          <select className="filter-select" value={localResolved} onChange={handleResolvedChange}>
            <option value="">Все</option>
            <option value="false">Новые</option>
            <option value="true">Решённые</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {isLoading && <div className="loading-state">Загрузка ошибок...</div>}
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Сообщение</th>
              <th>URL</th>
              <th>Пользователь</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {data?.logs.length ? data.logs.map((log) => (
              <tr key={log.id} className={!log.resolved ? 'unresolved-row' : ''}>
                <td className="text-muted">{formatShortDate(log.created_at)}</td>
                <td>
                  <span className="error-type-badge">{log.error_type}</span>
                </td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.message.length > 100 ? log.message.slice(0, 100) + '...' : log.message}
                </td>
                <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {log.url ? (log.url.length > 40 ? log.url.slice(0, 40) + '...' : log.url) : '—'}
                </td>
                <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {log.user_id ? log.user_id.slice(0, 8) + '...' : '—'}
                </td>
                <td>
                  <span className={`status-badge ${log.resolved ? 'success' : 'active'}`}>
                    {log.resolved ? 'Решён' : 'Новый'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="empty-state">Нет ошибок</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={totalPages} total={data.total} isLoading={isLoading} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}