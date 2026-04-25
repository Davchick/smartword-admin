import type { AdminOverview } from '../types';

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="panel metric">
      <div className="muted">{title}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}

type Props = {
  overview: AdminOverview | null;
  isLoading: boolean;
};

export function OverviewTab({ overview, isLoading }: Props) {
  if (isLoading) {
    return <section className="panel muted">Loading overview...</section>;
  }
  if (!overview) {
    return <section className="panel muted">No data yet.</section>;
  }

  return (
    <section className="metric-grid">
      <Metric title="Total users" value={overview.users_total} />
      <Metric title="New users 7d" value={overview.users_new_7d} />
      <Metric title="Verified users" value={overview.users_verified} />
      <Metric title="Active premium" value={overview.users_premium_active} />
      <Metric title="Total words" value={overview.words_total} />
      <Metric title="Total groups" value={overview.groups_total} />
      <Metric title="Payments total" value={overview.payments_total} />
      <Metric title="Revenue 30d (RUB)" value={overview.revenue_30d_rub.toFixed(2)} />
    </section>
  );
}
