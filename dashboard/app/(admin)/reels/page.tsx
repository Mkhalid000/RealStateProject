'use client';

import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';

interface ReelRow {
  id: string;
  caption: string | null;
  thumbnailUrl: string | null;
  isBoosted: boolean;
  likeCount: number;
  commentCount: number;
  agent?: {fullName: string | null};
}

export default function ReelsPage() {
  const [rows, setRows] = useState<ReelRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{items: ReelRow[]}>('/reels/feed?limit=30')
      .then(r => setRows(r.items))
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm('Delete this reel?')) return;
    setBusy(id);
    try {
      await apiFetch(`/admin/reels/${id}`, {method: 'DELETE'});
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1>Reels</h1>
      {error ? <div className="error">{error}</div> : null}
      <table>
        <thead>
          <tr>
            <th>Thumb</th>
            <th>Caption</th>
            <th>Agent</th>
            <th>Likes</th>
            <th>Comments</th>
            <th>Boosted</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>
                {r.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbnailUrl}
                    alt=""
                    style={{width: 44, height: 64, objectFit: 'cover', borderRadius: 6}}
                  />
                ) : (
                  '—'
                )}
              </td>
              <td style={{maxWidth: 280}}>{r.caption || '—'}</td>
              <td>{r.agent?.fullName || '—'}</td>
              <td>{r.likeCount}</td>
              <td>{r.commentCount}</td>
              <td>{r.isBoosted ? <span className="badge amber">Boosted</span> : '—'}</td>
              <td>
                <button
                  className="btn danger"
                  disabled={busy === r.id}
                  onClick={() => remove(r.id)}>
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
