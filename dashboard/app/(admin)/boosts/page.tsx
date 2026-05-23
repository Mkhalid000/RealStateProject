'use client';

import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';

interface BoostRow {
  id: string;
  amount: string | number;
  days: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  agent: {email: string; fullName: string | null};
}

export default function BoostsPage() {
  const [rows, setRows] = useState<BoostRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<BoostRow[]>('/admin/boosts').then(setRows).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runExpiry() {
    setBusy(true);
    try {
      await apiFetch('/admin/boosts/expire', {method: 'POST'});
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Boosts</h1>
      {error ? <div className="error">{error}</div> : null}
      <div className="toolbar">
        <button className="btn" onClick={runExpiry} disabled={busy}>
          {busy ? 'Running…' : 'Run expiry sweep'}
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Amount</th>
            <th>Days</th>
            <th>Status</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(b => (
            <tr key={b.id}>
              <td>{b.agent?.fullName || b.agent?.email}</td>
              <td>${Number(b.amount).toFixed(2)}</td>
              <td>{b.days}</td>
              <td>
                <span
                  className={`badge ${b.status === 'active' ? 'green' : 'amber'}`}>
                  {b.status}
                </span>
              </td>
              <td>{b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
