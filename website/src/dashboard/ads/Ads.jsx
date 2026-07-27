import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {apiFetch} from '../../lib/api';

const STATE = {
  live: {cls: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500'},
  scheduled: {cls: 'bg-sky-50 text-sky-600', dot: 'bg-sky-500'},
  paused: {cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400'},
  draft: {cls: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400'},
  expired: {cls: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400'},
  capped: {cls: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500'},
};

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: '2-digit'}) : '—';
const pct = n => `${(n * 100).toFixed(1)}%`;

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

export default function Ads() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({limit: '50'});
    if (kind) sp.set('kind', kind);
    if (q.trim()) sp.set('q', q.trim());
    apiFetch(`/ads?${sp.toString()}`)
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [kind, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function toggleStatus(c) {
    const next = c.status === 'active' ? 'paused' : 'active';
    await apiFetch(`/ads/${c.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({status: next}),
    }).catch(e => setError(e.message));
    load();
  }

  async function remove(c) {
    if (!window.confirm(`Delete “${c.name}”? Its delivery history goes with it.`)) return;
    await apiFetch(`/ads/${c.id}`, {method: 'DELETE'}).catch(e => setError(e.message));
    load();
  }

  const live = rows.filter(r => r.state === 'live').length;
  const impressions = rows.reduce((s, r) => s + (r.impressions || 0), 0);
  const clicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Advertising</div>
          <p className="mt-0.5 text-sm text-muted">House promos and sponsored listings across the site</p>
        </div>
        <Link
          to="/admin/ads/new"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light">
          New campaign
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <Summary label="Campaigns" value={rows.length} tint="#f2a65a" />
        <Summary label="Live now" value={live} tint="#10b981" />
        <Summary label="Impressions" value={impressions.toLocaleString()} tint="#8b5cf6" />
        <Summary label="Clicks" value={clicks.toLocaleString()} tint="#0ea5e9" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setKind('')} className={filterBtn(!kind)}>All</button>
        <button onClick={() => setKind('house')} className={filterBtn(kind === 'house')}>House ads</button>
        <button onClick={() => setKind('sponsored')} className={filterBtn(kind === 'sponsored')}>Sponsored listings</button>
        <input
          className="ml-auto w-56 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-gold"
          placeholder="Search campaigns…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10.5px] uppercase tracking-[0.07em] text-muted">
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">Placements</th>
                <th className="px-4 py-3 font-bold">Schedule</th>
                <th className="px-4 py-3 font-bold">Delivery</th>
                <th className="px-4 py-3 font-bold">State</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 4}).map((_, i) => (
                  <tr key={i} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-5 w-full animate-pulse rounded bg-surface2" />
                    </td>
                  </tr>
                ))
              ) : rows.length ? (
                rows.map(c => {
                  const st = STATE[c.state] || STATE.draft;
                  return (
                    <tr key={c.id} className="border-b border-line last:border-b-0 hover:bg-surface2/30">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {(c.imageUrl || c.property?.imageUrls?.[0]) && (
                            <img
                              src={c.imageUrl || c.property.imageUrls[0]}
                              alt=""
                              className="h-10 w-14 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-semibold text-fg">{c.name}</div>
                            <div className="truncate text-xs text-muted">
                              {c.kind === 'sponsored'
                                ? `Sponsored · ${c.property?.title || 'listing removed'}`
                                : `House ad · ${c.headline || 'no headline'}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {c.slots.map(s => (
                            <span key={s} className="rounded-md bg-surface2 px-2 py-0.5 text-[10.5px] text-muted">
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted">
                        {fmtDate(c.startsAt)} → {fmtDate(c.endsAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-semibold text-fg">
                          {c.impressions.toLocaleString()} <span className="font-normal text-muted">impr.</span>
                        </div>
                        <div className="text-xs text-muted">
                          {c.clicks.toLocaleString()} clicks · CTR {pct(c.ctr)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${st.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {c.state}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== 'draft' && (
                            <button
                              onClick={() => toggleStatus(c)}
                              className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg">
                              {c.status === 'active' ? 'Pause' : 'Resume'}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/ads/${c.id}/edit`)}
                            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg">
                            Edit
                          </button>
                          <button
                            onClick={() => remove(c)}
                            className="rounded-lg border border-danger/30 px-2.5 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted">No campaigns yet.</p>
                    <Link
                      to="/admin/ads/new"
                      className="mt-4 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
                      Create the first one
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
