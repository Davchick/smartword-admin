import { useCallback, useEffect, useState } from 'react';
import type { AdminUserDetail, UserWordsResponse, UserGroupsResponse, UserPaymentsResponse } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type DetailTab = 'overview' | 'activity' | 'words' | 'groups' | 'payments';

type Props = {
  userDetail: AdminUserDetail;
  userWords: UserWordsResponse | null;
  userGroups: UserGroupsResponse | null;
  userPayments: UserPaymentsResponse | null;
  wordsLoading: boolean;
  groupsLoading: boolean;
  paymentsLoading: boolean;
  onClose: () => void;
  onGrantSubscription: (userId: string) => void;
  onResetWeeklyLimit: (userId: string) => void;
  onUpdateEmail: (userId: string, email: string) => Promise<void>;
  onFetchWords: (userId: string, page?: number, search?: string) => void;
  onFetchGroups: (userId: string, page?: number, search?: string) => void;
  onFetchPayments: (userId: string, page?: number) => void;
  mutationBusy: boolean;
};

export function UserDetailPanel({
  userDetail,
  userWords,
  userGroups,
  userPayments,
  wordsLoading,
  groupsLoading,
  paymentsLoading,
  onClose,
  onGrantSubscription,
  onResetWeeklyLimit,
  onUpdateEmail,
  onFetchWords,
  onFetchGroups,
  onFetchPayments,
  mutationBusy,
}: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState(userDetail.email);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [wordsSearch, setWordsSearch] = useState('');
  const [wordsPage, setWordsPage] = useState(1);
  const [groupsSearch, setGroupsSearch] = useState('');
  const [groupsPage, setGroupsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

  useEffect(() => {
    if (activeTab === 'words' && !userWords) {
      onFetchWords(userDetail.id);
    }
  }, [activeTab, userDetail.id, userWords, onFetchWords]);

  useEffect(() => {
    if (activeTab === 'groups' && !userGroups) {
      onFetchGroups(userDetail.id);
    }
  }, [activeTab, userDetail.id, userGroups, onFetchGroups]);

  useEffect(() => {
    if (activeTab === 'payments' && !userPayments) {
      onFetchPayments(userDetail.id);
    }
  }, [activeTab, userDetail.id, userPayments, onFetchPayments]);

  const handleStartEditEmail = useCallback(() => {
    setEditEmailValue(userDetail.email);
    setEmailError(null);
    setIsEditingEmail(true);
  }, [userDetail.email]);

  const handleCancelEditEmail = useCallback(() => {
    setIsEditingEmail(false);
    setEditEmailValue(userDetail.email);
    setEmailError(null);
  }, [userDetail.email]);

  const handleSaveEmail = useCallback(async () => {
    const trimmed = editEmailValue.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Неверный email');
      return;
    }
    if (trimmed === userDetail.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsUpdatingEmail(true);
    setEmailError(null);
    try {
      await onUpdateEmail(userDetail.id, trimmed);
      setIsEditingEmail(false);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setIsUpdatingEmail(false);
    }
  }, [editEmailValue, userDetail.id, userDetail.email, onUpdateEmail]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSaveEmail();
    } else if (e.key === 'Escape') {
      handleCancelEditEmail();
    }
  }, [handleSaveEmail, handleCancelEditEmail]);

  const handleWordsSearch = useCallback(() => {
    setWordsPage(1);
    onFetchWords(userDetail.id, 1, wordsSearch || undefined);
  }, [userDetail.id, wordsSearch, onFetchWords]);

  const handleGroupsSearch = useCallback(() => {
    setGroupsPage(1);
    onFetchGroups(userDetail.id, 1, groupsSearch || undefined);
  }, [userDetail.id, groupsSearch, onFetchGroups]);

  const handleWordsPageChange = useCallback((page: number) => {
    setWordsPage(page);
    onFetchWords(userDetail.id, page, wordsSearch || undefined);
  }, [userDetail.id, wordsSearch, onFetchWords]);

  const handleGroupsPageChange = useCallback((page: number) => {
    setGroupsPage(page);
    onFetchGroups(userDetail.id, page, groupsSearch || undefined);
  }, [userDetail.id, groupsSearch, onFetchGroups]);

  const handlePaymentsPageChange = useCallback((page: number) => {
    setPaymentsPage(page);
    onFetchPayments(userDetail.id, page);
  }, [userDetail.id, onFetchPayments]);

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className="user-info-grid">
            <div className="user-info-item">
              <span className="user-info-label">ID</span>
              <span className="user-info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{userDetail.id}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">Создан</span>
              <span className="user-info-value">{formatDate(userDetail.created_at)}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">Премиум</span>
              <span className={`status-badge ${userDetail.is_premium_active ? 'active' : 'inactive'}`}>
                {userDetail.is_premium_active ? '●' : '○'} {userDetail.is_premium_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">Подписка</span>
              <span className="user-info-value">{userDetail.subscription_type || '—'}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">Истекает</span>
              <span className="user-info-value">{formatDate(userDetail.subscription_expires_at)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div className="card clickable" style={{ padding: '16px' }} onClick={() => setActiveTab('words')}>
              <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Слова</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.words}</div>
            </div>
            <div className="card clickable" style={{ padding: '16px' }} onClick={() => setActiveTab('groups')}>
              <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Группы</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.groups}</div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Сессии</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.active_sessions}</div>
            </div>
            <div className="card clickable" style={{ padding: '16px' }} onClick={() => setActiveTab('payments')}>
              <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Платежи</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.payments}</div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'activity') {
      const activity = userDetail.activity;
      return (
        <div className="activity-stats">
          <div className="activity-section">
            <h4>Активность за последние 30 дней</h4>
            <div className="activity-grid">
              <div className="activity-card">
                <div className="activity-label">Слов изучено</div>
                <div className="activity-value">{activity.words_learned_last_30d.toLocaleString()}</div>
              </div>
              <div className="activity-card">
                <div className="activity-label">Сессий</div>
                <div className="activity-value">{activity.sessions_last_30d.toLocaleString()}</div>
              </div>
              <div className="activity-card">
                <div className="activity-label">Среднее слов/день</div>
                <div className="activity-value">{activity.average_words_per_day.toFixed(1)}</div>
              </div>
              <div className="activity-card">
                <div className="activity-label">Стрик (дней)</div>
                <div className="activity-value highlight">{activity.streak_days}</div>
              </div>
            </div>
          </div>

          <div className="activity-section">
            <h4>Активность за последние 7 дней</h4>
            <div className="activity-grid">
              <div className="activity-card">
                <div className="activity-label">Слов изучено</div>
                <div className="activity-value">{activity.words_learned_last_7d.toLocaleString()}</div>
              </div>
              <div className="activity-card">
                <div className="activity-label">Сессий</div>
                <div className="activity-value">{activity.sessions_last_7d.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="activity-section">
            <h4>Общая информация</h4>
            <div className="activity-info-grid">
              <div className="activity-info-item">
                <span className="activity-info-label">Последняя активность</span>
                <span className="activity-info-value">{formatDate(activity.last_active_at)}</span>
              </div>
              <div className="activity-info-item">
                <span className="activity-info-label">Самый активный день</span>
                <span className="activity-info-value">{activity.most_active_day_of_week || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'words') {
      const totalPages = userWords ? Math.max(1, Math.ceil(userWords.total / userWords.page_size)) : 1;
      return (
        <div>
          <div className="search-bar" style={{ marginBottom: '12px' }}>
            <input
              className="form-input"
              value={wordsSearch}
              onChange={(e) => setWordsSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleWordsSearch(); }}
              placeholder="Поиск слов..."
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleWordsSearch}>
              Найти
            </button>
          </div>
          {wordsLoading && <div className="loading-state">Загрузка...</div>}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Слово</th>
                  <th>Перевод</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {userWords?.words.length ? userWords.words.map((w) => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 500 }}>{w.word}</td>
                    <td className="text-muted">{w.translation}</td>
                    <td className="text-muted">{formatDate(w.created_at)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="empty-state">Нет слов</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {userWords && userWords.total > 0 && (
            <div className="pagination">
              <span className="pagination-info">Стр. {wordsPage} из {totalPages}</span>
              <div className="pagination-controls">
                <button type="button" className="btn btn-ghost btn-sm" disabled={wordsPage <= 1 || wordsLoading} onClick={() => handleWordsPageChange(wordsPage - 1)}>←</button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={wordsPage >= totalPages || wordsLoading} onClick={() => handleWordsPageChange(wordsPage + 1)}>→</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'groups') {
      const totalPages = userGroups ? Math.max(1, Math.ceil(userGroups.total / userGroups.page_size)) : 1;
      return (
        <div>
          <div className="search-bar" style={{ marginBottom: '12px' }}>
            <input
              className="form-input"
              value={groupsSearch}
              onChange={(e) => setGroupsSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGroupsSearch(); }}
              placeholder="Поиск групп..."
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleGroupsSearch}>
              Найти
            </button>
          </div>
          {groupsLoading && <div className="loading-state">Загрузка...</div>}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Слов</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {userGroups?.groups.length ? userGroups.groups.map((g) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 500 }}>{g.name}</td>
                    <td className="text-muted">{g.words_count}</td>
                    <td className="text-muted">{formatDate(g.created_at)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="empty-state">Нет групп</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {userGroups && userGroups.total > 0 && (
            <div className="pagination">
              <span className="pagination-info">Стр. {groupsPage} из {totalPages}</span>
              <div className="pagination-controls">
                <button type="button" className="btn btn-ghost btn-sm" disabled={groupsPage <= 1 || groupsLoading} onClick={() => handleGroupsPageChange(groupsPage - 1)}>←</button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={groupsPage >= totalPages || groupsLoading} onClick={() => handleGroupsPageChange(groupsPage + 1)}>→</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'payments') {
      const totalPages = userPayments ? Math.max(1, Math.ceil(userPayments.total / userPayments.page_size)) : 1;
      return (
        <div>
          {paymentsLoading && <div className="loading-state">Загрузка...</div>}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тариф</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {userPayments?.payments.length ? userPayments.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted">{formatDate(p.created_at)}</td>
                    <td>{p.plan_id}</td>
                    <td>{p.amount ? `${p.amount} ₽` : '—'}</td>
                    <td><span className={`status-badge ${p.status === 'succeeded' ? 'active' : 'inactive'}`}>{p.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="empty-state">Нет платежей</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {userPayments && userPayments.total > 0 && (
            <div className="pagination">
              <span className="pagination-info">Стр. {paymentsPage} из {totalPages}</span>
              <div className="pagination-controls">
                <button type="button" className="btn btn-ghost btn-sm" disabled={paymentsPage <= 1 || paymentsLoading} onClick={() => handlePaymentsPageChange(paymentsPage - 1)}>←</button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={paymentsPage >= totalPages || paymentsLoading} onClick={() => handlePaymentsPageChange(paymentsPage + 1)}>→</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <aside className="user-detail-panel">
      <div className="user-detail-header">
        <div>
          <h3>Пользователь</h3>
          {isEditingEmail ? (
            <div className="email-edit-row">
              <input
                type="email"
                className="form-input"
                value={editEmailValue}
                onChange={(e) => setEditEmailValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isUpdatingEmail}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isUpdatingEmail}
                onClick={handleSaveEmail}
              >
                {isUpdatingEmail ? '...' : '✓'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={isUpdatingEmail}
                onClick={handleCancelEditEmail}
              >
                ✕
              </button>
              {emailError && <span className="text-error" style={{ fontSize: '12px' }}>{emailError}</span>}
            </div>
          ) : (
            <p
              className="text-muted text-sm"
              style={{ margin: '4px 0 0', cursor: 'pointer' }}
              onClick={handleStartEditEmail}
              title="Нажмите для редактирования"
            >
              {userDetail.email}
            </p>
          )}
        </div>
        <button type="button" className="user-close-btn" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </div>

      <div className="detail-tabs">
        <button type="button" className={`detail-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Обзор</button>
        <button type="button" className={`detail-tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Активность</button>
        <button type="button" className={`detail-tab ${activeTab === 'words' ? 'active' : ''}`} onClick={() => setActiveTab('words')}>Слова</button>
        <button type="button" className={`detail-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>Группы</button>
        <button type="button" className={`detail-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Платежи</button>
      </div>

      <div className="detail-tab-content">
        {renderTabContent()}
      </div>

      {activeTab === 'overview' && (
        <div className="user-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={mutationBusy}
            onClick={() => onGrantSubscription(userDetail.id)}
          >
            Выдать подписку
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={mutationBusy}
            onClick={() => onResetWeeklyLimit(userDetail.id)}
          >
            Сбросить лимит
          </button>
        </div>
      )}
    </aside>
  );
}