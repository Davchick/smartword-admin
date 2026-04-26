import { useCallback, useState } from 'react';
import type { AdminUsersResponse, UsersFilters } from '../types';

export type { UsersFilters };

type Props = {
  users: AdminUsersResponse | null;
  search: string;
  filters: UsersFilters;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event?: React.FormEvent) => void;
  onFiltersChange: (filters: UsersFilters) => void;
  onPageChange: (page: number) => void;
  onOpenUser: (userId: string) => void;
  isLoading: boolean;
  openUserId: string | null;
  selectedUsers: string[];
  onSelectUser: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onBulkGrantSubscription: (userIds: string[]) => void;
  onSaveFilter: (name: string) => void;
  savedFilters: Array<{ id: string; name: string }>;
  onLoadFilter: (id: string) => void;
  onDeleteFilter: (id: string) => void;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {});
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function getValueFromFilters<T extends keyof UsersFilters>(
  filters: UsersFilters,
  key: T,
  whenTrue: string,
  whenFalse: string,
  defaultValue: string
): string {
  const value = filters[key];
  if (value === undefined) return defaultValue;
  return value ? whenTrue : whenFalse;
}

export function UsersTab({
  users,
  search,
  filters,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onPageChange,
  onOpenUser,
  isLoading,
  openUserId,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onBulkGrantSubscription,
  onSaveFilter,
  savedFilters,
  onLoadFilter,
  onDeleteFilter,
}: Props) {
  const totalPages = users ? Math.max(1, Math.ceil(users.total / users.page_size)) : 1;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState('');

  const allSelected = users?.users.length ? users.users.every((u) => selectedUsers.includes(u.id)) : false;
  const someSelected = selectedUsers.length > 0;

  const handlePremiumFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      isPremium: value === 'all' ? undefined : value === 'premium',
    });
  }, [filters, onFiltersChange]);

  const handleVerifiedFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      verified: value === 'all' ? undefined : value === 'verified',
    });
  }, [filters, onFiltersChange]);

  const handleActivityFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      hasActivity: value === 'all' ? undefined : value === 'active',
      lastActiveAfter: value === 'inactive' ? getDateDaysAgo(30) : undefined,
    });
  }, [filters, onFiltersChange]);

  const handleHasWordsFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      hasWords: value === 'all' ? undefined : value === 'has',
    });
  }, [filters, onFiltersChange]);

  const handleHasGroupsFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      hasGroups: value === 'all' ? undefined : value === 'has',
    });
  }, [filters, onFiltersChange]);

  const handleDateChange = useCallback((field: 'createdAfter' | 'createdBefore', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  }, [filters, onFiltersChange]);

  const handleWordsMinChange = useCallback((value: string) => {
    const num = value ? parseInt(value, 10) : undefined;
    onFiltersChange({
      ...filters,
      wordsLearnedMin: num !== undefined && !isNaN(num) ? num : undefined,
    });
  }, [filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasFilters = Object.entries(filters).some(([, value]) => {
    return value !== undefined && value !== '';
  });

  const premiumValue = getValueFromFilters(filters, 'isPremium', 'premium', 'free', 'all');
  const verifiedValue = getValueFromFilters(filters, 'verified', 'verified', 'unverified', 'all');
  const activityValue = filters.hasActivity !== undefined
    ? (filters.hasActivity ? 'active' : 'inactive')
    : (filters.lastActiveAfter ? 'inactive' : 'all');
  const wordsValue = getValueFromFilters(filters, 'hasWords', 'has', 'none', 'all');
  const groupsValue = getValueFromFilters(filters, 'hasGroups', 'has', 'none', 'all');

  return (
    <div>
      <div className="search-bar">
        <input
          className="form-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit?.(); }}
          placeholder="Поиск по email или ID..."
        />
        <button type="submit" className="btn btn-primary" onClick={() => onSearchSubmit?.()}>
          Найти
        </button>
        <button
          type="button"
          className={`btn btn-ghost ${showAdvancedFilters ? 'active' : ''}`}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          style={{ marginLeft: '8px' }}
        >
          {showAdvancedFilters ? 'Скрыть фильтры' : 'Расширенные'}
        </button>
        {savedFilters.length > 0 && (
          <select
            className="filter-select"
            style={{ marginLeft: '8px', width: 'auto' }}
            onChange={(e) => {
              const selectedId = e.target.value;
              setSelectedSavedFilterId(selectedId);
              if (selectedId) onLoadFilter(selectedId);
            }}
            value={selectedSavedFilterId}
          >
            <option value="">Сохранённые фильтры</option>
            {savedFilters.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}
        {selectedSavedFilterId && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onDeleteFilter(selectedSavedFilterId);
              setSelectedSavedFilterId('');
            }}
            title="Удалить выбранный фильтр"
          >
            🗑
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowSaveFilter(true)}
          title="Сохранить текущий фильтр"
        >
          💾
        </button>
      </div>

      {showSaveFilter && (
        <div className="filters-bar">
          <div className="filter-group" style={{ flex: 1 }}>
            <input
              className="form-input"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Название фильтра..."
              onKeyDown={(e) => { if (e.key === 'Enter' && filterName.trim()) { onSaveFilter(filterName.trim()); setShowSaveFilter(false); setFilterName(''); } }}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { if (filterName.trim()) { onSaveFilter(filterName.trim()); setShowSaveFilter(false); setFilterName(''); } }}>
            Сохранить
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowSaveFilter(false); setFilterName(''); }}>
            Отмена
          </button>
        </div>
      )}

      {someSelected && (
        <div className="filters-bar" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)' }}>
          <span style={{ fontWeight: 500 }}>
            Выбрано: {selectedUsers.length} пользователей
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onBulkGrantSubscription(selectedUsers)}
          >
            Выдать подписку
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { selectedUsers.forEach((id) => onSelectUser(id, false)); }}
          >
            Снять выбор
          </button>
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-group">
          <label>Премиум:</label>
          <select className="filter-select" value={premiumValue} onChange={handlePremiumFilter}>
            <option value="all">Все</option>
            <option value="premium">Премиум</option>
            <option value="free">Без премиума</option>
          </select>
        </div>

        <div className="filter-group">
          <label>С:</label>
          <input
            type="date"
            className="filter-input"
            value={filters.createdAfter ?? ''}
            onChange={(e) => handleDateChange('createdAfter', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>По:</label>
          <input
            type="date"
            className="filter-input"
            value={filters.createdBefore ?? ''}
            onChange={(e) => handleDateChange('createdBefore', e.target.value)}
          />
        </div>

        {hasFilters && (
          <button type="button" className="btn btn-ghost" onClick={handleClearFilters}>
            Очистить
          </button>
        )}
      </div>

      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Верификация:</label>
            <select className="filter-select" value={verifiedValue} onChange={handleVerifiedFilter}>
              <option value="all">Все</option>
              <option value="verified">Подтверждён</option>
              <option value="unverified">Не подтверждён</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Активность:</label>
            <select className="filter-select" value={activityValue} onChange={handleActivityFilter}>
              <option value="all">Все</option>
              <option value="active">Активны (30 дней)</option>
              <option value="inactive">Неактивны (30 дней)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Слова:</label>
            <select className="filter-select" value={wordsValue} onChange={handleHasWordsFilter}>
              <option value="all">Все</option>
              <option value="has">Есть слова</option>
              <option value="none">Нет слов</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Группы:</label>
            <select className="filter-select" value={groupsValue} onChange={handleHasGroupsFilter}>
              <option value="all">Все</option>
              <option value="has">Есть группы</option>
              <option value="none">Нет групп</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Мин. слов:</label>
            <input
              type="number"
              className="filter-input"
              value={filters.wordsLearnedMin ?? ''}
              onChange={(e) => handleWordsMinChange(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      )}

      <div className="table-container">
        {isLoading && <div className="loading-state">Загрузка пользователей...</div>}
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>Email</th>
              <th>Создан</th>
              <th>Премиум</th>
              <th>Слов / нед.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users?.users.length ? (
              users.users.map((user) => (
                <tr
                  key={user.id}
                  className={selectedUsers.includes(user.id) ? 'selected-row' : 'clickable-row'}
                  onClick={() => onOpenUser(user.id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => onSelectUser(user.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(user.id);
                      }}
                      title="Копировать ID"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '2px 6px' }}
                    >
                      {user.id.slice(0, 8)}...
                    </button>
                  </td>
                  <td style={{ fontWeight: 500 }}>{user.email}</td>
                  <td className="text-muted">{formatDate(user.created_at)}</td>
                  <td>
                    <span className={`status-badge ${user.is_premium_active ? 'active' : 'inactive'}`}>
                      {user.is_premium_active ? '●' : '○'} {user.is_premium_active ? 'Активен' : 'Нет'}
                    </span>
                  </td>
                  <td className="text-muted">{user.words_learned_this_week}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={openUserId === user.id}
                      onClick={(e) => { e.stopPropagation(); onOpenUser(user.id); }}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      {openUserId === user.id ? 'Загрузка...' : 'Открыть'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-state">Нет пользователей</td>
              </tr>
            )}
          </tbody>
        </table>
        {users && users.total > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Страница {users.page} из {totalPages} · {users.total.toLocaleString()} пользователей
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={users.page <= 1 || isLoading}
                onClick={() => onPageChange(users.page - 1)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Назад
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={users.page >= totalPages || isLoading}
                onClick={() => onPageChange(users.page + 1)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Далее
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}