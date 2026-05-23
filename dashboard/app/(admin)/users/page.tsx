'use client';

import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';

interface AdminUserRow {
  id: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
  fullName: string | null;
  isVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (q) params.set('q', q);
    apiFetch<AdminUserRow[]>(`/admin/users?${params.toString()}`)
      .then(setRows)
      .catch(e => setError(e.message));
  }, [roleFilter, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVerify(u: AdminUserRow) {
    setBusy(u.id);
    try {
      await apiFetch(`/admin/users/${u.id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({isVerified: !u.isVerified}),
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(u: AdminUserRow, role: string) {
    setBusy(u.id);
    try {
      await apiFetch(`/admin/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({role}),
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1>Users & Agents</h1>
      {error ? <div className="error">{error}</div> : null}
      <div className="toolbar">
        <input
          className="input"
          style={{margin: 0, maxWidth: 240}}
          placeholder="Search name / email"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="input"
          style={{margin: 0, maxWidth: 160}}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="user">Buyers</option>
          <option value="agent">Agents</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td>{u.fullName || '—'}</td>
              <td>{u.email}</td>
              <td>
                <select
                  className="input"
                  style={{margin: 0, padding: '4px 8px'}}
                  value={u.role}
                  disabled={busy === u.id}
                  onChange={e => changeRole(u, e.target.value)}>
                  <option value="user">user</option>
                  <option value="agent">agent</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                {u.isVerified ? (
                  <span className="badge green">Verified</span>
                ) : (
                  <span className="badge">No</span>
                )}
              </td>
              <td>
                <button
                  className="btn outline"
                  disabled={busy === u.id}
                  onClick={() => toggleVerify(u)}>
                  {u.isVerified ? 'Unverify' : 'Verify'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
