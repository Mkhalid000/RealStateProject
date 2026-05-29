import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';

export default function Boosts() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch('/admin/boosts').then(setRows).catch(e => setError(e.message));
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
        <button className="btn sm" onClick={runExpiry} disabled={busy}>
          {busy ? 'Running…' : 'Run Expiry Sweep'}
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
                <span className={`badge ${b.status === 'active' ? 'green' : 'gold'}`}>
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
