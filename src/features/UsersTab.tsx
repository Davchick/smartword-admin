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
  if (!value) return '-';
  return new Date(value).toLocaleString();
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
    <section className="panel">
      <form onSubmit={onSearchSubmit} className="row">
        <label className="field">
          <span>Search user</span>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Email or user id"
          />
        </label>
        <button type="submit" disabled={isLoading}>Search</button>
      </form>

      {isLoading && <div className="muted">Loading users...</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Created</th>
              <th>Premium</th>
              <th>Words/week</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.users.length ? (
              users.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>{user.is_premium_active ? 'Yes' : 'No'}</td>
                  <td>{user.words_learned_this_week}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost"
                      disabled={openUserId === user.id}
                      onClick={() => onOpenUser(user.id)}
                    >
                      {openUserId === user.id ? 'Opening...' : 'Open'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="muted">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row pagination">
        <button
          type="button"
          className="ghost"
          disabled={!users || users.page <= 1 || isLoading}
          onClick={() => users && onPageChange(users.page - 1)}
        >
          Previous
        </button>
        <span className="muted">
          Page {users?.page ?? 1} / {totalPages}
        </span>
        <button
          type="button"
          className="ghost"
          disabled={!users || users.page >= totalPages || isLoading}
          onClick={() => users && onPageChange(users.page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
