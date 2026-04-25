import type { AdminOverview } from '../types';

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-card">
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value">{value}</div>
    </div>
  );
}

type Props = {
  overview: AdminOverview | null;
  isLoading: boolean;
};

export function OverviewTab({ overview, isLoading }: Props) {
  if (isLoading) {
    return <div className="loading-state">Loading overview...</div>;
  }
  if (!overview) {
    return <div className="empty-state">No data available</div>;
  }

  return (
    <div>
      <div className="metrics-grid">
        <MetricCard label="Total Users" value={overview.users_total.toLocaleString()} />
        <MetricCard label="New Users (7d)" value={overview.users_new_7d.toLocaleString()} />
        <MetricCard label="Verified Users" value={overview.users_verified.toLocaleString()} />
        <MetricCard label="Active Premium" value={overview.users_premium_active.toLocaleString()} />
        <MetricCard label="Total Words" value={overview.words_total.toLocaleString()} />
        <MetricCard label="Total Groups" value={overview.groups_total.toLocaleString()} />
        <MetricCard label="Payments Total" value={overview.payments_total.toLocaleString()} />
        <MetricCard label="Revenue (30d)" value={`₽${overview.revenue_30d_rub.toFixed(0)}`} />
      </div>
    </div>
  );
}