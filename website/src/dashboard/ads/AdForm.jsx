import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';

const KINDS = [
  {value: 'house', label: 'House ad', hint: 'Your own promo — image, copy and a call to action.'},
  {value: 'sponsored', label: 'Sponsored listing', hint: 'Promote an existing property into the slot.'},
];
const STATUSES = ['draft', 'active', 'paused'];
const TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];
const DEVICES = [
  {value: '', label: 'All devices'},
  {value: 'mobile', label: 'Mobile only'},
  {value: 'desktop', label: 'Desktop only'},
];
const AUDIENCES = [
  {value: '', label: 'Everyone'},
  {value: 'guest', label: 'Signed-out visitors'},
  {value: 'user', label: 'Signed-in users'},
  {value: 'agent', label: 'Agents'},
];

const TRIGGERS = [
  {value: 'delay', label: 'After a delay', unit: 'seconds', hint: 'Waits this long once the page settles.'},
  {value: 'scroll', label: 'At a scroll depth', unit: '% scrolled', hint: 'Fires once the visitor reaches this much of the page.'},
  {value: 'exit_intent', label: 'On exit intent', unit: null, hint: 'When the pointer heads for the tab bar. Falls back to 45s on touch.'},
  {value: 'immediate', label: 'Immediately', unit: null, hint: 'Shows at once — use sparingly, it reads as a popup.'},
];
const FREQUENCIES = [
  {value: 'session', label: 'Once per session'},
  {value: 'daily', label: 'Once per day'},
  {value: 'always', label: 'Every page view'},
];
const ACCENTS = ['#f2a65a', '#6f8f72', '#e0654f', '#8b5cf6', '#0ea5e9', '#ec4899'];

const EMPTY = {
  name: '', kind: 'house', status: 'draft',
  headline: '', body: '', imageUrl: '', ctaLabel: '', ctaUrl: '',
  propertyId: '',
  slots: [], priority: 0, weight: 1,
  startsAt: '', endsAt: '',
  maxImpressions: '', dailyCap: '',
  targetCities: '', targetTypes: [], targetListingType: '', targetDevice: '', targetAudience: '',
  accent: '', showCountdown: false, dismissible: true,
  trigger: 'delay', triggerValue: 8, frequency: 'session',
};

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** ISO ⇄ the value a <input type="datetime-local"> expects (local time). */
const toLocalInput = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const input =
  'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-gold [&>option]:text-ink';
const label = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted';

function Section({title, hint, children}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-sm font-bold text-fg">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Chip({on, onClick, children}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        on ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-fg'
      }`}>
      {children}
    </button>
  );
}

function Toggle({on, onChange, children, hint}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-[13px] font-medium text-fg">{children}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-gold' : 'bg-surface2 ring-1 ring-line'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

/**
 * Renders the creative roughly as the public site will, so the admin isn't
 * guessing what a headline + image + accent actually look like together.
 */
function Preview({form, property}) {
  const accent = form.accent || '#f2a65a';
  const sponsored = form.kind === 'sponsored';
  const image = sponsored ? property?.imageUrls?.[0] : form.imageUrl;
  const headline = sponsored ? property?.title : form.headline;
  const body = sponsored
    ? [property?.locality, property?.city].filter(Boolean).join(', ')
    : form.body;
  const modal = form.slots.includes('global_modal');
  const floating = form.slots.includes('global_floating');
  const shape = modal ? 'Modal' : floating ? 'Floating card' : 'In-page unit';

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-fg">Preview</h2>
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          {shape}
        </span>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-2xl border"
        style={{borderColor: `${accent}55`, boxShadow: `0 18px 44px -24px ${accent}`}}>
        <div className="relative aspect-[16/9] bg-neutral-900">
          {image ? (
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-white/40">
              No image yet
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70">
            Sponsored
          </span>
          {form.showCountdown && form.endsAt && (
            <span
              className="absolute right-3 top-3 rounded-md border bg-black/50 px-1.5 py-1 font-mono text-[11px] font-bold text-white"
              style={{borderColor: accent}}>
              ends in …
            </span>
          )}
          {headline && (
            <p className="absolute bottom-3 left-3 right-3 font-serif text-xl leading-tight text-white">
              {headline}
            </p>
          )}
        </div>

        <div className="bg-white p-4">
          {body && <p className="line-clamp-2 text-[13px] text-neutral-500">{body}</p>}
          {(form.ctaLabel || sponsored) && (
            <span
              className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#211d1d]"
              style={{backgroundColor: accent}}>
              {form.ctaLabel || 'View residence'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Indicative only — the live unit adapts to whichever slot serves it.
      </p>
    </div>
  );
}

/** Search-as-you-type picker for the sponsored-listing property. */
function PropertyPicker({value, property, onPick}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const sp = new URLSearchParams({limit: '8'});
      if (q.trim()) sp.set('q', q.trim());
      apiFetch(`/properties/admin?${sp.toString()}`)
        .then(r => setResults(r.items || []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div>
      {property && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 p-3">
          {property.imageUrls?.[0] && (
            <img src={property.imageUrls[0]} alt="" className="h-12 w-16 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{property.title}</p>
            <p className="truncate text-xs text-muted">
              {[property.locality, property.city].filter(Boolean).join(', ')}
            </p>
          </div>
          <button type="button" onClick={() => onPick(null)} className="text-xs text-danger hover:underline">
            Change
          </button>
        </div>
      )}

      {!property && (
        <>
          <input
            className={input}
            placeholder="Search a property by title or location…"
            value={q}
            onFocus={() => setOpen(true)}
            onChange={e => { setQ(e.target.value); setOpen(true); }}
          />
          {open && results.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line">
              {results.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onPick(p); setOpen(false); setQ(''); }}
                  className="flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-surface2">
                  {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt="" className="h-9 w-12 rounded object-cover" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">{p.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {[p.locality, p.city].filter(Boolean).join(', ')} · {p.verificationStatus}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {!property && value && <p className="mt-2 text-xs text-muted">Selected: {value}</p>}
    </div>
  );
}

export default function AdForm() {
  const {id} = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [property, setProperty] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // slot metadata drives the picker, the "interrupts" badge and the preview shape
  const groupedSlots = useMemo(() => {
    const map = new Map();
    slots.forEach(s => map.set(s.group, [...(map.get(s.group) || []), s]));
    return [...map.entries()];
  }, [slots]);
  const interrupting = useMemo(
    () => form.slots.some(key => slots.find(s => s.key === key)?.interrupting),
    [form.slots, slots],
  );
  const activeTrigger = TRIGGERS.find(t => t.value === form.trigger) || TRIGGERS[0];

  const set = (key, value) => setForm(f => ({...f, [key]: value}));
  const toggle = (key, value) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value],
    }));

  useEffect(() => {
    apiFetch('/ads/slots').then(setSlots).catch(() => setSlots([]));
  }, []);

  const load = useCallback(() => {
    if (!editing) return;
    setLoading(true);
    apiFetch(`/ads/${id}`)
      .then(c => {
        setForm({
          name: c.name || '',
          kind: c.kind || 'house',
          status: c.status || 'draft',
          headline: c.headline || '',
          body: c.body || '',
          imageUrl: c.imageUrl || '',
          ctaLabel: c.ctaLabel || '',
          ctaUrl: c.ctaUrl || '',
          propertyId: c.propertyId || '',
          slots: c.slots || [],
          priority: c.priority ?? 0,
          weight: c.weight ?? 1,
          startsAt: toLocalInput(c.startsAt),
          endsAt: toLocalInput(c.endsAt),
          maxImpressions: c.maxImpressions ?? '',
          dailyCap: c.dailyCap ?? '',
          targetCities: (c.targetCities || []).join(', '),
          targetTypes: c.targetTypes || [],
          targetListingType: c.targetListingType || '',
          targetDevice: c.targetDevice || '',
          targetAudience: c.targetAudience || '',
          accent: c.accent || '',
          showCountdown: Boolean(c.showCountdown),
          dismissible: c.dismissible !== false,
          trigger: c.trigger || 'delay',
          triggerValue: c.triggerValue ?? 8,
          frequency: c.frequency || 'session',
        });
        setProperty(c.property || null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!form.slots.length) return setError('Pick at least one placement.');
    if (form.kind === 'sponsored' && !form.propertyId) {
      return setError('Choose the property this campaign promotes.');
    }
    if (form.kind === 'house' && !form.headline && !form.imageUrl) {
      return setError('A house ad needs a headline or an image.');
    }

    const num = v => (v === '' || v == null ? undefined : Number(v));
    const payload = {
      name: form.name,
      kind: form.kind,
      status: form.status,
      slots: form.slots,
      priority: Number(form.priority) || 0,
      weight: Number(form.weight) || 1,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      maxImpressions: num(form.maxImpressions),
      dailyCap: num(form.dailyCap),
      targetCities: form.targetCities.split(',').map(s => s.trim()).filter(Boolean),
      targetTypes: form.targetTypes,
      targetListingType: form.targetListingType || undefined,
      targetDevice: form.targetDevice || undefined,
      targetAudience: form.targetAudience || undefined,
      ctaLabel: form.ctaLabel || undefined,
      accent: form.accent || undefined,
      showCountdown: form.showCountdown,
      dismissible: form.dismissible,
      trigger: form.trigger,
      triggerValue: Number(form.triggerValue) || 0,
      frequency: form.frequency,
    };

    if (form.kind === 'sponsored') {
      payload.propertyId = form.propertyId;
    } else {
      payload.headline = form.headline || undefined;
      payload.body = form.body || undefined;
      payload.imageUrl = form.imageUrl || undefined;
      payload.ctaUrl = form.ctaUrl || undefined;
    }

    setSaving(true);
    try {
      await apiFetch(editing ? `/ads/${id}` : '/ads', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      navigate('/admin/ads');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">Loading campaign…</div>;
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">
            {editing ? 'Edit campaign' : 'New campaign'}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            House promos and sponsored listings across the public site
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/ads')}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-fg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:opacity-60">
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create campaign'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Section title="Campaign" hint="Internal name — visitors never see this.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Name</label>
                <input className={input} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Post-property push — July" />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Type</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {KINDS.map(k => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => set('kind', k.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        form.kind === k.value ? 'border-gold bg-gold/10' : 'border-line hover:border-gold/40'
                      }`}>
                      <span className={`block text-sm font-semibold ${form.kind === k.value ? 'text-gold' : 'text-fg'}`}>{k.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{k.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {form.kind === 'house' ? (
            <Section title="Creative" hint="What the visitor actually sees.">
              <div className="grid gap-4">
                <div>
                  <label className={label}>Headline</label>
                  <input className={input} value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="List your property free on Aurevia" />
                </div>
                <div>
                  <label className={label}>Body</label>
                  <textarea className={`${input} min-h-[90px] resize-y`} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Reach thousands of verified buyers…" />
                </div>
                <div>
                  <label className={label}>Image URL</label>
                  <input className={input} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" />
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label}>CTA label</label>
                    <input className={input} value={form.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} placeholder="Post for free" />
                  </div>
                  <div>
                    <label className={label}>CTA link</label>
                    <input className={input} value={form.ctaUrl} onChange={e => set('ctaUrl', e.target.value)} placeholder="/post-property" />
                  </div>
                </div>
                <p className="text-xs text-muted">
                  A link starting with <code>/</code> stays inside the site; anything else opens in a new tab.
                </p>
              </div>
            </Section>
          ) : (
            <Section title="Promoted listing" hint="The property rendered as a native card with a “Sponsored” label.">
              <PropertyPicker
                value={form.propertyId}
                property={property}
                onPick={p => { setProperty(p); set('propertyId', p?.id || ''); }}
              />
              <div className="mt-4">
                <label className={label}>CTA label (optional)</label>
                <input className={input} value={form.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} placeholder="View residence" />
              </div>
            </Section>
          )}

          <Section title="Targeting" hint="Leave a field empty to show the ad to everyone.">
            <div className="grid gap-4">
              <div>
                <label className={label}>Cities</label>
                <input className={input} value={form.targetCities} onChange={e => set('targetCities', e.target.value)} placeholder="Mumbai, Bangalore" />
                <p className="mt-1 text-xs text-muted">Comma separated. Matches the city the visitor is filtering by.</p>
              </div>
              <div>
                <label className={label}>Property types</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map(t => (
                    <Chip key={t} on={form.targetTypes.includes(t)} onClick={() => toggle('targetTypes', t)}>{cap(t)}</Chip>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={label}>Listing type</label>
                  <select className={input} value={form.targetListingType} onChange={e => set('targetListingType', e.target.value)}>
                    <option value="">Buy &amp; Rent</option>
                    <option value="buy">Buy only</option>
                    <option value="rent">Rent only</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Device</label>
                  <select className={input} value={form.targetDevice} onChange={e => set('targetDevice', e.target.value)}>
                    {DEVICES.map(d => <option key={d.label} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Audience</label>
                  <select className={input} value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}>
                    {AUDIENCES.map(a => <option key={a.label} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ── right rail ── */}
        <div className="space-y-5">
          <Preview form={form} property={property} />

          <Section title="Placement" hint="Where this campaign may appear.">
            <div className="space-y-4">
              {groupedSlots.map(([group, list]) => (
                <div key={group}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{group}</p>
                  <div className="space-y-2">
                    {list.map(s => (
                      <label key={s.key} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-2.5 transition-colors hover:border-gold/40">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-[#f2a65a]"
                          checked={form.slots.includes(s.key)}
                          onChange={() => toggle('slots', s.key)}
                        />
                        <span className="text-[13px] leading-snug text-fg">
                          {s.label}
                          {s.interrupting && (
                            <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                              interrupts
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {!slots.length && <p className="text-xs text-muted">Loading placements…</p>}
            </div>
          </Section>

          <Section title="Appearance">
            <div className="grid gap-4">
              <div>
                <label className={label}>Accent colour</label>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENTS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('accent', form.accent === c ? '' : c)}
                      aria-label={c}
                      style={{backgroundColor: c}}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        form.accent === c ? 'scale-110 ring-2 ring-fg ring-offset-2' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                  <input
                    className="ml-1 w-24 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-fg outline-none focus:border-gold"
                    value={form.accent}
                    onChange={e => set('accent', e.target.value)}
                    placeholder="#f2a65a"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">Tints the CTA, glow and countdown. Empty = site gold.</p>
              </div>

              <Toggle
                on={form.showCountdown}
                onChange={v => set('showCountdown', v)}
                hint={form.endsAt ? 'Counts down to the end date.' : 'Needs an end date to show.'}>
                Live countdown
              </Toggle>
            </div>
          </Section>

          {interrupting && (
            <Section title="Behaviour" hint="Applies to the modal and floating placements.">
              <div className="grid gap-4">
                <div>
                  <label className={label}>Trigger</label>
                  <select className={input} value={form.trigger} onChange={e => set('trigger', e.target.value)}>
                    {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <p className="mt-1.5 text-xs text-muted">{activeTrigger.hint}</p>
                </div>

                {activeTrigger.unit && (
                  <div>
                    <label className={label}>{activeTrigger.unit}</label>
                    <input
                      type="number"
                      min="0"
                      className={input}
                      value={form.triggerValue}
                      onChange={e => set('triggerValue', e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className={label}>Frequency</label>
                  <select className={input} value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <p className="mt-1.5 text-xs text-muted">
                    Remembered per visitor, so a dismissal actually sticks.
                  </p>
                </div>

                <Toggle
                  on={form.dismissible}
                  onChange={v => set('dismissible', v)}
                  hint="Turning this off removes the close button — use with care.">
                  Visitor can close it
                </Toggle>
              </div>
            </Section>
          )}

          <Section title="Schedule">
            <div className="grid gap-4">
              <div>
                <label className={label}>Starts</label>
                <input type="datetime-local" className={input} value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
              </div>
              <div>
                <label className={label}>Ends</label>
                <input type="datetime-local" className={input} value={form.endsAt} onChange={e => set('endsAt', e.target.value)} />
              </div>
              <p className="text-xs text-muted">Leave empty to run indefinitely.</p>
            </div>
          </Section>

          <Section title="Delivery">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Priority</label>
                  <input type="number" className={input} value={form.priority} onChange={e => set('priority', e.target.value)} />
                </div>
                <div>
                  <label className={label}>Weight</label>
                  <input type="number" min="1" className={input} value={form.weight} onChange={e => set('weight', e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted">
                Highest priority wins a slot. Campaigns tied on priority share it, drawn by weight.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Total cap</label>
                  <input type="number" min="1" className={input} value={form.maxImpressions} onChange={e => set('maxImpressions', e.target.value)} placeholder="∞" />
                </div>
                <div>
                  <label className={label}>Daily cap</label>
                  <input type="number" min="1" className={input} value={form.dailyCap} onChange={e => set('dailyCap', e.target.value)} placeholder="∞" />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Status">
            <select className={input} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
            <p className="mt-2 text-xs text-muted">
              Only <strong className="text-fg">active</strong> campaigns are served, and only inside their schedule.
            </p>
          </Section>
        </div>
      </div>
    </form>
  );
}
