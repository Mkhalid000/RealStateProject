import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';

export default function ManageProperties() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    apiFetch('/properties?limit=50')
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
    if (!confirm('Delete this property?')) return;
    setBusy(id);
    try {
      await apiFetch(`/admin/properties/${id}`, {method: 'DELETE'});
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1>Properties</h1>
      {error ? <div className="error">{error}</div> : null}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Agent</th>
            <th>Type</th>
            <th>Price</th>
            <th>Location</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.agent?.fullName || '—'}</td>
              <td>{p.type}</td>
              <td>${Number(p.price).toLocaleString()}</td>
              <td>{p.locationText || '—'}</td>
              <td>
                <button
                  className="btn danger sm"
                  disabled={busy === p.id}
                  onClick={() => remove(p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
