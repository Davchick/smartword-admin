export type AdminOverview = {
  users_total: number;
  users_new: number;
  users_new_change: number | null;
  users_verified: number;
  users_premium_active: number;
  users_premium_new: number;
  users_premium_change: number | null;
  words_total: number;
  groups_total: number;
  payments_total: number;
  payments_count: number;
  payments_change: number | null;
  revenue: number;
  revenue_change: number | null;
  retention: RetentionMetrics | undefined;
};

export type RetentionMetrics = {
  new_users: number;
  converted_to_premium: number;
  conversion_rate: number;
  average_time_to_convert_days: number | null;
  premium_churn_30d: number;
  premium_churn_rate: number;
};

export type CohortData = {
  cohort_date: string;
  total_users: number;
  retained_users: number;
  retention_rate: number;
  converted_to_premium: number;
  conversion_rate: number;
  revenue: number;
};

export type CohortResponse = {
  data: CohortData[];
  period_start: string;
  period_end: string;
};

export type RevenueMetrics = {
  total_revenue: number;
  revenue_change: number | null;
  average_revenue_per_user: number;
  lifetime_value: number;
  arpu_change: number | null;
  ltv_growth: number | null;
};

export type ChurnMetrics = {
  churn_rate_30d: number;
  churn_rate_90d: number;
  churned_users_30d: number;
  churned_users_90d: number;
  at_risk_users: number;
};

export interface SavedFilter {
  id: string;
  name: string;
  tab: AdminTab;
  filters: UsersFilters;
  created_at: string;
}

export interface BulkOperationResult {
  user_id: string;
  success: boolean;
  error?: string;
}

export type ChartDataPoint = {
  date: string;
  users: number;
  revenue: number;
  payments: number;
};

export type AdminChartResponse = {
  data: ChartDataPoint[];
};

export type AdminTab = 'overview' | 'users' | 'payments' | 'consents' | 'audit' | 'tickets' | 'errorLogs';
export type Period = '7d' | '30d' | '90d';

export interface DateRange {
  start: string;
  end: string;
}

export type PeriodOrCustom = Period | { type: 'custom'; range: DateRange };

export function isCustomPeriod(period: PeriodOrCustom): period is { type: 'custom'; range: DateRange } {
  return typeof period === 'object' && period !== null && 'type' in period && period.type === 'custom';
}

export function serializePeriod(period: PeriodOrCustom): string {
  if (isCustomPeriod(period)) {
    return `${period.range.start}/${period.range.end}`;
  }
  return period;
}

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  email_verified: boolean;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  is_premium_active: boolean;
  words_learned_this_week: number;
  ai_messages_used: number;
};

export type AdminUsersResponse = {
  page: number;
  page_size: number;
  total: number;
  users: AdminUser[];
};

export type AdminUserDetail = AdminUser & {
  week_start_date: string | null;
  counts: {
    words: number;
    groups: number;
    payments: number;
    active_sessions: number;
  };
  recent_payments: Array<{
    id: string;
    payment_id: string;
    plan_id: string;
    amount: number | null;
    status: string;
    created_at: string;
  }>;
  activity: UserActivity;
};

export type UserActivity = {
  words_learned_last_30d: number;
  words_learned_last_7d: number;
  sessions_last_30d: number;
  sessions_last_7d: number;
  last_active_at: string | null;
  streak_days: number;
  average_words_per_day: number;
  most_active_day_of_week: string | null;
};

export type PaymentsResponse = {
  page: number;
  page_size: number;
  total: number;
  payments: Array<{
    id: string;
    user_id: string;
    user_email: string | null;
    payment_id: string;
    plan_id: string;
    amount: number | null;
    status: string;
    created_at: string;
  }>;
};

export type ConsentsResponse = {
  page: number;
  page_size: number;
  total: number;
  consents: Array<{
    id: string;
    user_id: string | null;
    email: string | null;
    consent_type: string;
    policy_version: string;
    granted: boolean;
    ip_address: string;
    created_at: string;
  }>;
};

export type AdminAuditResponse = {
  page: number;
  page_size: number;
  total: number;
  items: Array<{
    id: string;
    admin_email: string | null;
    admin_user_id: string | null;
    action: string;
    target_type: string;
    target_id: string | null;
    ip_address: string | null;
    outcome: string;
    created_at: string;
  }>;
};

export type UserWordsResponse = {
  page: number;
  page_size: number;
  total: number;
  words: Array<{
    id: string;
    word: string;
    translation: string;
    created_at: string;
  }>;
};

export type UserGroupsResponse = {
  page: number;
  page_size: number;
  total: number;
  groups: Array<{
    id: string;
    name: string;
    words_count: number;
    created_at: string;
  }>;
};

export type UserPaymentsResponse = {
  page: number;
  page_size: number;
  total: number;
  payments: Array<{
    id: string;
    payment_id: string | null;
    plan_id: string;
    amount: number | null;
    status: string;
    created_at: string;
  }>;
};

export type SearchResultType = 'user' | 'payment' | 'word';

export interface ExtendedSearchResult {
  type: SearchResultType;
  user_id?: string;
  payment_id?: string;
  word_id?: string;
  email?: string;
  word?: string;
  translation?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  is_premium_active?: boolean;
}

export interface ExtendedSearchResponse {
  users: Array<{
    user_id: string;
    email: string;
    created_at: string;
    is_premium_active: boolean;
  }>;
  payments: Array<{
    payment_id: string;
    user_id: string;
    user_email: string | null;
    amount: number | null;
    status: string;
    created_at: string;
  }>;
  words: Array<{
    word_id: string;
    user_id: string;
    word: string;
    translation: string;
    created_at: string;
  }>;
}

export interface UsersFilters {
  isPremium?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  hasActivity?: boolean;
  hasWords?: boolean;
  hasGroups?: boolean;
  verified?: boolean;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  wordsLearnedMin?: number;
  wordsLearnedMax?: number;
}

export type TicketsResponse = {
  page: number;
  page_size: number;
  total: number;
  tickets: Array<{
    id: string;
    user_id: string | null;
    email: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    assigned_to: string | null;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
  }>;
};

export type TicketDetail = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type ErrorLogsResponse = {
  page: number;
  page_size: number;
  total: number;
  logs: Array<{
    id: string;
    user_id: string | null;
    error_type: string;
    message: string;
    stack: string | null;
    url: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
    resolved: boolean;
    created_at: string;
  }>;
};
