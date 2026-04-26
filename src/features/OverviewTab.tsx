import { useEffect, useState, useRef } from 'react';
import type { AdminOverview, AdminChartResponse, PeriodOrCustom, RetentionMetrics, CohortData, RevenueMetrics, ChurnMetrics } from '../types';
import { PeriodSelector } from '../components/PeriodSelector';
import { TrendChart } from '../components/TrendChart';
import { adminFetch, fetchCohortData, fetchRevenueMetrics, fetchChurnMetrics } from '../api';

function RetentionSection({ retention }: { retention: RetentionMetrics | undefined }) {
  if (!retention) {
    return null;
  }
  const conversionPercent = retention.conversion_rate;
  const churnPercent = retention.premium_churn_rate;

  return (
    <div className="retention-section">
      <h3 className="section-title">Воронка конверсии</h3>
      <div className="retention-grid">
        <div className="retention-card">
          <div className="retention-label">Новые пользователи</div>
          <div className="retention-value">{retention.new_users.toLocaleString()}</div>
        </div>
        <div className="retention-card">
          <div className="retention-label">Конвертировано в премиум</div>
          <div className="retention-value highlight">{retention.converted_to_premium.toLocaleString()}</div>
        </div>
        <div className="retention-card">
          <div className="retention-label">Конверсия</div>
          <div className={`retention-value ${conversionPercent >= 10 ? 'success' : conversionPercent >= 5 ? 'warning' : 'danger'}`}>
            {conversionPercent.toFixed(1)}%
          </div>
        </div>
        <div className="retention-card">
          <div className="retention-label">Среднее время до конверсии</div>
          <div className="retention-value">
            {retention.average_time_to_convert_days !== null ? `${retention.average_time_to_convert_days} дн.` : '—'}
          </div>
        </div>
        <div className="retention-card">
          <div className="retention-label">Отток премиум (30 дней)</div>
          <div className={`retention-value ${churnPercent > 10 ? 'danger' : churnPercent > 5 ? 'warning' : 'success'}`}>
            {retention.premium_churn_30d.toLocaleString()} ({churnPercent.toFixed(1)}%)
          </div>
        </div>
        <div className="retention-card">
          <div className="retention-label">留存率 премиум</div>
          <div className="retention-value">
            {(100 - churnPercent).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  overview: AdminOverview | null;
  isLoading: boolean;
  period: PeriodOrCustom;
  onPeriodChange: (period: PeriodOrCustom) => void;
  config: { token: string; email: string };
  onMetricClick?: (filter: { type: 'premium' | 'verified' | 'new'; value?: boolean }) => void;
};

interface MetricCardProps {
  label: string;
  value: string | number;
  change: number | null;
  subValue?: string | number;
  onClick?: () => void;
  clickable?: boolean;
}

function MetricCard({ label, value, change, subValue, onClick, clickable }: MetricCardProps) {
  return (
    <div className={`metric-card ${clickable ? 'clickable' : ''}`} onClick={onClick}>
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {subValue !== undefined && (
        <div className="metric-card-sub">{typeof subValue === 'number' ? subValue.toLocaleString() : subValue}</div>
      )}
      {change !== null && (
        <div className={`metric-card-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

const CHART_TABS = [
  { id: 'users' as const, label: 'Пользователи' },
  { id: 'revenue' as const, label: 'Доход' },
  { id: 'payments' as const, label: 'Платежи' },
];

export function OverviewTab({ overview, isLoading, period, onPeriodChange, config, onMetricClick }: Props) {
  const [chartData, setChartData] = useState<AdminChartResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'users' | 'revenue' | 'payments'>('users');
  const [cohortData, setCohortData] = useState<CohortData[] | null>(null);
  const [, setCohortLoading] = useState(false);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [, setRevenueLoading] = useState(false);
  const [churnMetrics, setChurnMetrics] = useState<ChurnMetrics | null>(null);
  const [, setChurnLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadingRef = useRef({ chart: false, cohort: false, revenue: false, churn: false });

  const getPeriodParam = (p: PeriodOrCustom): string => {
    if (typeof p === 'object' && p !== null && 'type' in p && p.type === 'custom') {
      return `${p.range.start}/${p.range.end}`;
    }
    return p;
  };

  useEffect(() => {
    if (loadingRef.current.chart) return;
    let cancelled = false;
    loadingRef.current.chart = true;
    async function loadChart() {
      setChartLoading(true);
      setLoadError(null);
      try {
        const data = await adminFetch<AdminChartResponse>(
          `/overview/chart/${activeChart}?period=${getPeriodParam(period)}`,
          config,
        );
        if (!cancelled) {
          setChartData(data);
        }
      } catch {
        setLoadError('Не удалось загрузить данные графика. Попробуйте обновить страницу.');
      } finally {
        if (!cancelled) {
          setChartLoading(false);
        }
        loadingRef.current.chart = false;
      }
    }
    void loadChart();
    return () => { cancelled = true; };
  }, [period, config, activeChart]);

  useEffect(() => {
    if (loadingRef.current.cohort) return;
    let cancelled = false;
    loadingRef.current.cohort = true;
    async function loadCohort() {
      setCohortLoading(true);
      try {
        const periodParam = getPeriodParam(period);
        const [start, end] = periodParam.includes('/') ? periodParam.split('/') : ['', ''];
        const data = await fetchCohortData(config, start || periodParam, end || periodParam);
        if (!cancelled) {
          setCohortData(data.data);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Не удалось загрузить когортный анализ.');
      } finally {
        if (!cancelled) {
          setCohortLoading(false);
        }
        loadingRef.current.cohort = false;
      }
    }
    void loadCohort();
    return () => { cancelled = true; };
  }, [period, config]);

  useEffect(() => {
    if (loadingRef.current.revenue) return;
    let cancelled = false;
    loadingRef.current.revenue = true;
    async function loadRevenue() {
      setRevenueLoading(true);
      try {
        const data = await fetchRevenueMetrics(config, getPeriodParam(period));
        if (!cancelled) {
          setRevenueMetrics(data);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Не удалось загрузить метрики выручки.');
      } finally {
        if (!cancelled) {
          setRevenueLoading(false);
        }
        loadingRef.current.revenue = false;
      }
    }
    void loadRevenue();
    return () => { cancelled = true; };
  }, [period, config]);

  useEffect(() => {
    if (loadingRef.current.churn) return;
    let cancelled = false;
    loadingRef.current.churn = true;
    async function loadChurn() {
      setChurnLoading(true);
      try {
        const data = await fetchChurnMetrics(config, getPeriodParam(period));
        if (!cancelled) {
          setChurnMetrics(data);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Не удалось загрузить churn-метрики.');
      } finally {
        if (!cancelled) {
          setChurnLoading(false);
        }
        loadingRef.current.churn = false;
      }
    }
    void loadChurn();
    return () => { cancelled = true; };
  }, [period, config]);

  if (isLoading) {
    return <div className="loading-state">Загрузка...</div>;
  }

  if (!overview) {
    return <div className="empty-state">Нет данных</div>;
  }

  return (
    <div className="overview-tab">
      <div className="overview-header">
        <PeriodSelector value={period} onChange={onPeriodChange} />
      </div>
      {loadError && <div className="error-banner">{loadError}</div>}

      <div className="metrics-grid">
        <MetricCard
          label="Всего пользователей"
          value={overview.users_total}
          change={overview.users_new_change}
          subValue={`+${overview.users_new} новых`}
          onClick={() => onMetricClick?.({ type: 'new' })}
          clickable
        />
        <MetricCard
          label="Премиум"
          value={overview.users_premium_active}
          change={overview.users_premium_change}
          subValue={`+${overview.users_premium_new} новых`}
          onClick={() => onMetricClick?.({ type: 'premium', value: true })}
          clickable
        />
        <MetricCard
          label="Подтверждённые"
          value={overview.users_verified}
          change={null}
          onClick={() => onMetricClick?.({ type: 'verified' })}
          clickable
        />
        <MetricCard
          label="Доход"
          value={`₽${overview.revenue.toLocaleString()}`}
          change={overview.revenue_change}
        />
        <MetricCard
          label="Платежи"
          value={overview.payments_count}
          change={overview.payments_change}
          subValue={`всего ${overview.payments_total.toLocaleString()}`}
        />
        <MetricCard
          label="Слова"
          value={overview.words_total.toLocaleString()}
          change={null}
        />
        <MetricCard
          label="Группы"
          value={overview.groups_total.toLocaleString()}
          change={null}
        />
      </div>

      <RetentionSection retention={overview.retention} />

      <div className="metrics-grid">
        <MetricCard
          label="ARPU"
          value={revenueMetrics ? `₽${revenueMetrics.average_revenue_per_user.toLocaleString()}` : '—'}
          change={revenueMetrics?.arpu_change ?? null}
          subValue={revenueMetrics ? `LTV: ₽${revenueMetrics.lifetime_value.toLocaleString()}` : undefined}
        />
        <MetricCard
          label="LTV"
          value={revenueMetrics ? `₽${revenueMetrics.lifetime_value.toLocaleString()}` : '—'}
          change={revenueMetrics?.ltv_growth ?? null}
        />
        <MetricCard
          label="Churn 30d"
          value={churnMetrics ? `${churnMetrics.churn_rate_30d.toFixed(1)}%` : '—'}
          change={null}
          subValue={churnMetrics ? `${churnMetrics.churned_users_30d} пользователей` : undefined}
        />
        <MetricCard
          label="Churn 90d"
          value={churnMetrics ? `${churnMetrics.churn_rate_90d.toFixed(1)}%` : '—'}
          change={null}
          subValue={churnMetrics ? `${churnMetrics.at_risk_users} в зоне риска` : undefined}
        />
      </div>

      {cohortData && cohortData.length > 0 && (
        <div className="retention-section">
          <h3 className="section-title">Когортный анализ</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Когорта</th>
                  <th>Пользователей</th>
                  <th>Осталось</th>
                  <th>Retention</th>
                  <th>Конвертация</th>
                  <th>Доход</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.slice(0, 12).map((cohort) => (
                  <tr key={cohort.cohort_date}>
                    <td className="text-muted">{cohort.cohort_date}</td>
                    <td>{cohort.total_users}</td>
                    <td>{cohort.retained_users}</td>
                    <td className={cohort.retention_rate >= 50 ? 'success' : cohort.retention_rate >= 20 ? 'warning' : 'danger'}>
                      {cohort.retention_rate.toFixed(1)}%
                    </td>
                    <td className={cohort.conversion_rate >= 10 ? 'success' : cohort.conversion_rate >= 5 ? 'warning' : 'danger'}>
                      {cohort.conversion_rate.toFixed(1)}%
                    </td>
                    <td>₽{cohort.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-tabs">
            {CHART_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
                onClick={() => setActiveChart(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          {chartLoading ? (
            <div className="loading-state">Загрузка графика...</div>
          ) : (
            <TrendChart
              data={chartData?.data ?? []}
              metric={activeChart}
              height={220}
            />
          )}
        </div>
      </div>
    </div>
  );
}