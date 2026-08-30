import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';

const fmt = d =>
  d
    ? new Date(d).toLocaleString('en-US', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})
    : '—';

const filterBtn = active =>
  `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:text-fg'
  }`;

export default function BlogComments() {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({limit: '50'});
    if (state) sp.set('state', state);
    apiFetch(`/blog/admin/comments?${sp.toString()}`)
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [state]);

  useEffect(load, [load]);

  async function approve(c) {
    await apiFetch(`/blog/comments/${c.id}/approve`, {method: 'PATCH'}).catch(e => setError(e.message));
    load();
  }

  async function remove(c) {
    if (!window.confirm('Delete this comment?')) return;
    await apiFetch(`/blog/comments/${c.id}`, {method: 'DELETE'}).catch(e => setError(e.message));
    load();
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Comments</div>
          <p className="mt-0.5 text-sm text-muted">Reader comments wait here until you approve them</p>
        </div>
        <Link
          to="/admin/blog"
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-gold hover:text-gold">
          Back to articles
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          {v: 'pending', l: 'Awaiting review'},
          {v: 'approved', l: 'Approved'},
          {v: 'all', l: 'All'},
        ].map(f => (
          <button key={f.v} onClick={() => setState(f.v)} className={filterBtn(state === f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center text-muted">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center text-muted">
          {state === 'pending' ? 'Nothing waiting — you are all caught up.' : 'No comments here.'}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(c => (
            <div key={c.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-ink">
                  {(c.user?.fullName || 'R').charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{c.user?.fullName || 'Reader'}</p>
                  <p className="text-xs text-muted">{fmt(c.createdAt)}</p>
                </div>

                {c.isApproved ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">Approved</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">Pending</span>
                )}
                {c.parentId && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">Reply</span>
                )}

                <div className="ml-auto flex gap-1.5">
                  {!c.isApproved && (
                    <button onClick={() => approve(c)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-emerald-600 transition-colors hover:border-emerald-400">
                      Approve
                    </button>
                  )}
                  <button onClick={() => remove(c)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-danger transition-colors hover:border-danger">
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg/80">{c.text}</p>

              {c.post && (
                <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                  on{' '}
                  <Link to={`/blog/${c.post.slug}`} className="text-gold" target="_blank" rel="noreferrer">
                    {c.post.title}
                  </Link>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
