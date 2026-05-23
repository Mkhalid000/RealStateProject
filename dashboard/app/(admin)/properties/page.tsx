'use client';

import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';

interface PropertyRow {
  id: string;
  title: string;
  price: number;
  type: string;
  locationText: string | null;
  agent?: {fullName: string | null};
}

export default function PropertiesPage() {
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{items: PropertyRow[]}>('/properties?limit=50')
      .then(r => setRows(r.items))
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
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
                  className="btn danger"
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
