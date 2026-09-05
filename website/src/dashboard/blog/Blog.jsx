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

/** Headlines run long — keep the column readable without a tooltip-only title. */
const TITLE_CHARS = 48;
const clampChars = (text = '', limit = TITLE_CHARS) => {
  const t = String(text).trim();
  if (t.length <= limit) return t;
  // Cut back to the last space so a word is never sliced in half — unless that
  // would throw away most of the line, in which case take the hard cut.
  const cut = t.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`;
};

const PAGE_SIZE = 10;

const Icon = ({d, size = 15}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M17.9 17.9A10.3 10.3 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5.1-5.9m3.3-1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22" /></>,
  prev: <path d="m15 18-6-6 6-6" />,
  next: <path d="m9 18 6-6-6-6" />,
};

/** Placeholder row shown while a page of articles is on its way. */
function SkeletonRow() {
  const bar = 'rounded-full bg-surface2';
  return (
    <tr className="border-b border-line/70 last:border-b-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-16 shrink-0 rounded-lg bg-surface2" />
          <div className="min-w-0 flex-1">
            <div className={`h-3.5 w-52 max-w-full ${bar}`} />
            <div className={`mt-2 h-2.5 w-24 ${bar} opacity-70`} />
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5"><div className={`h-3 w-24 ${bar} opacity-70`} /></td>
      <td className="px-5 py-3.5"><div className="h-6 w-24 rounded-full bg-surface2" /></td>
      <td className="px-5 py-3.5"><div className={`h-3 w-16 ${bar} opacity-70`} /></td>
      <td className="px-5 py-3.5"><div className={`ml-auto h-3 w-10 ${bar} opacity-70`} /></td>
      <td className="px-5 py-3.5">
        <div className="flex justify-end gap-1.5">
          {[0, 1, 2].map(i => <div key={i} className="h-8 w-8 rounded-lg bg-surface2" />)}
        </div>
      </td>
    </tr>
  );
}

/** Matching placeholder for the four counters above the table. */
function SummarySkeleton() {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5">
          <div className="h-2.5 w-24 rounded-full bg-surface2" />
          <div className="mt-3 h-6 w-14 rounded-md bg-surface2" />
          <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.06] to-transparent" />
        </div>
      ))}
    </div>
  );
}

/** Square icon button used for every row action. */
function Action({onClick, label, icon, tone = 'muted'}) {
  const tones = {
    muted: 'text-muted hover:border-gold hover:text-gold',
    danger: 'text-danger hover:border-danger',
    good: 'text-emerald-600 hover:border-emerald-400',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-line transition-colors ${tones[tone]}`}>
      <Icon d={icon} />
    </button>
  );
}

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({page: String(page), limit: String(PAGE_SIZE)});
    if (status) sp.set('status', status);
    if (q.trim()) sp.set('q', q.trim());
    apiFetch(`/blog/admin?${sp.toString()}`)
      .then(r => {
        setRows(r.items || []);
        setTotal(r.total || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, q, page]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  // A new filter or search starts from the first page again.
  useEffect(() => setPage(1), [status, q]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  /* Deleting the only row on the last page should step back, not strand the
     user on an empty page. */
  const afterRemove = () => {
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
    else load();
  };

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
    afterRemove();
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

      {!overview && <SummarySkeleton />}

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

      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
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
              Array.from({length: Math.min(PAGE_SIZE, Math.max(rows.length, 5))}).map((_, i) => (
                <SkeletonRow key={i} />
              ))
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
                          <p className="truncate font-medium text-fg" title={p.title}>
                            {clampChars(p.title)}
                          </p>
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
                          <Action onClick={() => verify(p)} label="Approve" icon={I.check} tone="good" />
                        )}
                        <Action
                          onClick={() => setPostStatus(p, p.status === 'published' ? 'draft' : 'published')}
                          label={p.status === 'published' ? 'Unpublish' : 'Publish'}
                          icon={p.status === 'published' ? I.eyeOff : I.eye}
                        />
                        <Action
                          onClick={() => navigate(`/admin/blog/${p.id}/edit`)}
                          label="Edit article"
                          icon={I.edit}
                        />
                        <Action onClick={() => remove(p)} label="Delete article" icon={I.trash} tone="danger" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {loading && (
          <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.07] to-transparent" />
        )}

        {/* pagination */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
            <p className="text-xs text-muted">
              Showing <span className="font-semibold text-fg">{from}–{to}</span> of{' '}
              <span className="font-semibold text-fg">{total}</span>
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                aria-label="Previous page"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-40">
                <Icon d={I.prev} size={14} />
              </button>

              {pageNumbers(page, pageCount).map((n, i) =>
                n === '…' ? (
                  <span key={`gap${i}`} className="px-1 text-xs text-muted">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    disabled={loading}
                    aria-current={n === page ? 'page' : undefined}
                    className={`h-8 min-w-[32px] rounded-lg border px-2 text-xs font-semibold transition-colors ${
                      n === page
                        ? 'border-gold bg-gold/15 text-gold'
                        : 'border-line text-muted hover:border-gold/50 hover:text-fg'
                    }`}>
                    {n}
                  </button>
                ),
              )}

              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount || loading}
                aria-label="Next page"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-40">
                <Icon d={I.next} size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Page numbers with ellipses — first, last, and a window around the current
 * page, so the control stays the same width however many articles there are.
 */
function pageNumbers(current, count) {
  if (count <= 7) return Array.from({length: count}, (_, i) => i + 1);

  const pages = new Set([1, count, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach(n => pages.add(n));
  if (current >= count - 2) [count - 3, count - 2, count - 1].forEach(n => pages.add(n));

  const sorted = [...pages].filter(n => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}
