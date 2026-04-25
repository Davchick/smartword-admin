export type AdminOverview = {
  users_total: number;
  users_new_7d: number;
  users_verified: number;
  users_premium_active: number;
  words_total: number;
  groups_total: number;
  payments_total: number;
  revenue_30d_rub: number;
};

export type AdminTab = 'overview' | 'users' | 'payments' | 'consents' | 'audit';

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
};

export type PaymentsResponse = {
  payments: Array<{
    id: string;
    user_id: string;
    payment_id: string;
    plan_id: string;
    amount: number | null;
    status: string;
    created_at: string;
  }>;
};

export type ConsentsResponse = {
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
