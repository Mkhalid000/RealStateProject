import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (q) params.set('q', q);
    apiFetch(`/admin/users?${params.toString()}`)
      .then(setRows)
      .catch(e => setError(e.message));
  }, [roleFilter, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVerify(u) {
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

  async function changeRole(u, role) {
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
          className="field"
          placeholder="Search name / email"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select className="field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td>{u.fullName || '—'}</td>
              <td>{u.email}</td>
              <td>
                <select
                  className="field"
                  style={{padding: '6px 10px', minWidth: 110}}
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
                  className="btn ghost sm"
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
