import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';

export default function Reels() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    apiFetch('/reels/feed?limit=30')
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
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
                  <img
                    src={r.thumbnailUrl}
                    alt=""
                    style={{width: 44, height: 64, objectFit: 'cover'}}
                  />
                ) : (
                  '—'
                )}
              </td>
              <td style={{maxWidth: 280}}>{r.caption || '—'}</td>
              <td>{r.agent?.fullName || '—'}</td>
              <td>{r.likeCount}</td>
              <td>{r.commentCount}</td>
              <td>{r.isBoosted ? <span className="badge gold">Boosted</span> : '—'}</td>
              <td>
                <button
                  className="btn danger sm"
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
