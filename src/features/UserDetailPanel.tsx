import type { AdminUserDetail } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type Props = {
  userDetail: AdminUserDetail;
  onClose: () => void;
  onGrantSubscription: (userId: string) => void;
  onResetWeeklyLimit: (userId: string) => void;
  mutationBusy: boolean;
};

export function UserDetailPanel({
  userDetail,
  onClose,
  onGrantSubscription,
  onResetWeeklyLimit,
  mutationBusy,
}: Props) {
  return (
    <aside className="user-detail-panel">
      <div className="user-detail-header">
        <div>
          <h3>User Details</h3>
          <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>{userDetail.email}</p>
        </div>
        <button type="button" className="user-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="user-info-grid">
        <div className="user-info-item">
          <span className="user-info-label">User ID</span>
          <span className="user-info-value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{userDetail.id}</span>
        </div>
        <div className="user-info-item">
          <span className="user-info-label">Created</span>
          <span className="user-info-value">{formatDate(userDetail.created_at)}</span>
        </div>
        <div className="user-info-item">
          <span className="user-info-label">Premium Status</span>
          <span className={`status-badge ${userDetail.is_premium_active ? 'active' : 'inactive'}`}>
            {userDetail.is_premium_active ? '●' : '○'} {userDetail.is_premium_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="user-info-item">
          <span className="user-info-label">Subscription</span>
          <span className="user-info-value">{userDetail.subscription_type || '—'}</span>
        </div>
        <div className="user-info-item">
          <span className="user-info-label">Expires</span>
          <span className="user-info-value">{formatDate(userDetail.subscription_expires_at)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Words</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.words}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Groups</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.groups}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Sessions</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.active_sessions}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="text-muted text-sm" style={{ marginBottom: '4px' }}>Payments</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{userDetail.counts.payments}</div>
        </div>
      </div>

      <div className="user-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={mutationBusy}
          onClick={() => onGrantSubscription(userDetail.id)}
        >
          Grant Subscription
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={mutationBusy}
          onClick={() => onResetWeeklyLimit(userDetail.id)}
        >
          Reset Weekly Limit
        </button>
      </div>
    </aside>
  );
}