import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {apiFetch} from '../../lib/api';

const STATUS = {
  published: {label: 'Published', cls: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500'},
  draft: {label: 'Draft', cls: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400'},
  scheduled: {label: 'Scheduled', cls: 'bg-sky-50 text-sky-600', dot: 'bg-sky-500'},
  archived: {label: 'Archived', cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400'},
};

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: '2-digit'}) : '—';

const filterBtn = active =>
  `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:text-fg'
  }`;

function Summary({label, value, tint}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-1.5 text-2xl font-bold" style={{color: tint}}>{value}</div>
    </div>
  );
}

export default function Blog() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({limit: '50'});
    if (status) sp.set('status', status);
    if (q.trim()) sp.set('q', q.trim());
    apiFetch(`/blog/admin?${sp.toString()}`)
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => {
    apiFetch('/blog/admin/overview')
      .then(setOverview)
      .catch(() => setOverview(null));
  }, [rows.length]);

  async function setPostStatus(post, next) {
    await apiFetch(`/blog/${post.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({status: next}),
    }).catch(e => setError(e.message));
    load();
  }

  async function verify(post) {
    await apiFetch(`/blog/${post.id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({verificationStatus: 'verified'}),
    }).catch(e => setError(e.message));
    load();
  }

  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}”? Its comments and stats go with it.`)) return;
    await apiFetch(`/blog/${post.id}`, {method: 'DELETE'}).catch(e => setError(e.message));
    load();
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Blog</div>
          <p className="mt-0.5 text-sm text-muted">Articles, categories and reader comments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/blog/categories"
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-gold hover:text-gold">
            Categories
          </Link>
          <Link
            to="/admin/blog/comments"
            className="relative rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-gold hover:text-gold">
            Comments
            {overview?.pendingComments > 0 && (
              <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">
                {overview.pendingComments}
              </span>
            )}
          </Link>
          <Link
            to="/admin/blog/new"
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light">
            New article
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      {overview && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Published" value={overview.posts.published} tint="#10b981" />
          <Summary label="Drafts" value={overview.posts.drafts} tint="#a0a3b1" />
          <Summary label={`Views (${overview.window.days}d)`} value={overview.window.views.toLocaleString()} tint="#f2a65a" />
          <Summary label="Comments to review" value={overview.pendingComments} tint="#3b82f6" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          {v: '', l: 'All'},
          {v: 'published', l: 'Published'},
          {v: 'draft', l: 'Drafts'},
          {v: 'scheduled', l: 'Scheduled'},
          {v: 'archived', l: 'Archived'},
        ].map(f => (
          <button key={f.v} onClick={() => setStatus(f.v)} className={filterBtn(status === f.v)}>
            {f.l}
          </button>
        ))}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search articles…"
          className="ml-auto w-56 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-none transition-colors focus:border-gold/60 placeholder:text-muted"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.1em] text-muted">
              <th className="px-5 py-3 font-semibold">Article</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Published</th>
              <th className="px-5 py-3 text-right font-semibold">Views</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">No articles yet.</td></tr>
            ) : (
              rows.map(p => {
                const s = STATUS[p.status] || STATUS.draft;
                return (
                  <tr key={p.id} className="border-b border-line/70 last:border-b-0 hover:bg-surface2/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.coverImageUrl ? (
                          <img src={p.coverImageUrl} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-11 w-16 shrink-0 rounded-lg bg-surface2" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">{p.title}</p>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                            {p.readingMinutes} min
                            {p.isSponsored && <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">Sponsored</span>}
                            {p.isPromoted && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">Promoted</span>}
                            {!p.isVerified && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">Needs review</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{p.category?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{fmtDate(p.publishedAt)}</td>
                    <td className="px-5 py-3.5 text-right text-muted">{p.viewCount.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {!p.isVerified && (
                          <button onClick={() => verify(p)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-emerald-600 transition-colors hover:border-emerald-400">
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setPostStatus(p, p.status === 'published' ? 'draft' : 'published')}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold">
                          {p.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/blog/${p.id}/edit`)}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold">
                          Edit
                        </button>
                        <button
                          onClick={() => remove(p)}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-danger transition-colors hover:border-danger">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
