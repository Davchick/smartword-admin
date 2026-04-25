import { FormEvent } from 'react';
import type { AdminUsersResponse } from '../types';

type Props = {
  users: AdminUsersResponse | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onPageChange: (page: number) => void;
  onOpenUser: (userId: string) => void;
  isLoading: boolean;
  openUserId: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function UsersTab({
  users,
  search,
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  onOpenUser,
  isLoading,
  openUserId,
}: Props) {
  const totalPages = users ? Math.max(1, Math.ceil(users.total / users.page_size)) : 1;

  return (
    <div>
      <form onSubmit={onSearchSubmit} className="search-bar">
        <input
          className="form-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by email or user ID..."
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>Search</button>
      </form>

      <div className="table-container">
        {isLoading && <div className="loading-state">Loading users...</div>}
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Created</th>
              <th>Premium</th>
              <th>Words / Week</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users?.users.length ? (
              users.users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.email}</td>
                  <td className="text-muted">{formatDate(user.created_at)}</td>
                  <td>
                    <span className={`status-badge ${user.is_premium_active ? 'active' : 'inactive'}`}>
                      {user.is_premium_active ? '●' : '○'} {user.is_premium_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-muted">{user.words_learned_this_week}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={openUserId === user.id}
                      onClick={() => onOpenUser(user.id)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      {openUserId === user.id ? 'Opening...' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-state">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
        {users && users.total > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Page {users.page} of {totalPages} · {users.total.toLocaleString()} users
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={users.page <= 1 || isLoading}
                onClick={() => onPageChange(users.page - 1)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={users.page >= totalPages || isLoading}
                onClick={() => onPageChange(users.page + 1)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}