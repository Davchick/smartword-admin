import type { AdminAuditResponse, ConsentsResponse, PaymentsResponse } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function PaymentsTab({ data, isLoading }: { data: PaymentsResponse | null; isLoading: boolean }) {
  return (
    <section className="panel table-wrap">
      {isLoading && <div className="muted">Loading payments...</div>}
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>User</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.payments.length ? data.payments.map((item) => (
            <tr key={item.id}>
              <td>{formatDate(item.created_at)}</td>
              <td>{item.user_id}</td>
              <td>{item.plan_id}</td>
              <td>{item.amount ?? '-'}</td>
              <td>{item.status}</td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="muted">No payments found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export function ConsentsTab({ data, isLoading }: { data: ConsentsResponse | null; isLoading: boolean }) {
  return (
    <section className="panel table-wrap">
      {isLoading && <div className="muted">Loading consents...</div>}
      <table>
        <thead>
          <tr>
            <th>Created</th>
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
              <td>{formatDate(item.created_at)}</td>
              <td>{item.email ?? '-'}</td>
              <td>{item.consent_type}</td>
              <td>{item.policy_version}</td>
              <td>{item.granted ? 'Yes' : 'No'}</td>
              <td>{item.ip_address}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="muted">No consents found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export function AuditTab({ data, isLoading }: { data: AdminAuditResponse | null; isLoading: boolean }) {
  return (
    <section className="panel table-wrap">
      {isLoading && <div className="muted">Loading audit trail...</div>}
      <table>
        <thead>
          <tr>
            <th>Created</th>
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
              <td>{formatDate(item.created_at)}</td>
              <td>{item.admin_email ?? '-'}</td>
              <td>{item.action}</td>
              <td>{`${item.target_type}:${item.target_id ?? '-'}`}</td>
              <td>{item.outcome}</td>
              <td>{item.ip_address ?? '-'}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="muted">No audit entries found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
