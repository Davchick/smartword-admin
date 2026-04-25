import type { AdminAuditResponse, ConsentsResponse, PaymentsResponse } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active' || status === 'success' || status === 'completed' || status === 'granted';
  return <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>{status}</span>;
}

export function PaymentsTab({ data, isLoading }: { data: PaymentsResponse | null; isLoading: boolean }) {
  return (
    <div className="table-container">
      {isLoading && <div className="loading-state">Loading payments...</div>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>User ID</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.payments.length ? data.payments.map((item) => (
            <tr key={item.id}>
              <td className="text-muted">{formatDate(item.created_at)}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{item.user_id}</td>
              <td>{item.plan_id}</td>
              <td>{item.amount ?? '—'}</td>
              <td><StatusBadge status={item.status} /></td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="empty-state">No payments found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ConsentsTab({ data, isLoading }: { data: ConsentsResponse | null; isLoading: boolean }) {
  return (
    <div className="table-container">
      {isLoading && <div className="loading-state">Loading consents...</div>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Email</th>
            <th>Type</th>
            <th>Policy</th>
            <th>Granted</th>
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
              <td className="text-muted" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{item.ip_address}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="empty-state">No consents found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AuditTab({ data, isLoading }: { data: AdminAuditResponse | null; isLoading: boolean }) {
  return (
    <div className="table-container">
      {isLoading && <div className="loading-state">Loading audit trail...</div>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Target</th>
            <th>Outcome</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.length ? data.items.map((item) => (
            <tr key={item.id}>
              <td className="text-muted">{formatDate(item.created_at)}</td>
              <td className="text-muted">{item.admin_email ?? '—'}</td>
              <td style={{ fontWeight: 500 }}>{item.action}</td>
              <td className="text-muted" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                {item.target_type}:{item.target_id ?? '—'}
              </td>
              <td><StatusBadge status={item.outcome} /></td>
              <td className="text-muted" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{item.ip_address ?? '—'}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="empty-state">No audit entries found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}