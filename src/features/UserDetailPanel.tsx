import type { AdminUserDetail } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

type Props = {
  userDetail: AdminUserDetail | null;
  onGrantSubscription: (userId: string) => void;
  onResetWeeklyLimit: (userId: string) => void;
  mutationBusy: boolean;
};

export function UserDetailPanel({
  userDetail,
  onGrantSubscription,
  onResetWeeklyLimit,
  mutationBusy,
}: Props) {
  if (!userDetail) return null;

  return (
    <aside className="panel detail">
      <h3>User detail</h3>
      <div>Email: {userDetail.email}</div>
      <div>ID: {userDetail.id}</div>
      <div>Created: {formatDate(userDetail.created_at)}</div>
      <div>Premium: {userDetail.is_premium_active ? 'Yes' : 'No'}</div>
      <div>Subscription: {userDetail.subscription_type || '-'}</div>
      <div>Expires: {formatDate(userDetail.subscription_expires_at)}</div>
      <div>Words: {userDetail.counts.words}</div>
      <div>Groups: {userDetail.counts.groups}</div>
      <div>Sessions: {userDetail.counts.active_sessions}</div>
      <div>Payments: {userDetail.counts.payments}</div>
      <div className="row">
        <button type="button" disabled={mutationBusy} onClick={() => onGrantSubscription(userDetail.id)}>
          Grant subscription
        </button>
        <button type="button" className="ghost" disabled={mutationBusy} onClick={() => onResetWeeklyLimit(userDetail.id)}>
          Reset weekly limit
        </button>
      </div>
    </aside>
  );
}
