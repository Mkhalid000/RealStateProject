import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {uploadFile} from '../../lib/upload';
import {parseMarkdown, readingMinutes} from '../../lib/markdown';

const TABS = [
  {key: 'content', label: 'Content'},
  {key: 'taxonomy', label: 'Category & SEO'},
  {key: 'publishing', label: 'Publishing'},
  {key: 'ads', label: 'Advertising'},
  {key: 'listings', label: 'Related listings'},
];

const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  imageUrls: [],
  videoUrl: '',
  categoryId: '',
  tags: [],
  guestAuthorName: '',
  guestAuthorAvatar: '',
  status: 'draft',
  publishedAt: '',
  scheduledFor: '',
  featured: false,
  pinned: false,
  allowComments: true,
  metaTitle: '',
  metaDescription: '',
  ogImageUrl: '',
  canonicalUrl: '',
  noIndex: false,
  country: '',
  state: '',
  city: '',
  locality: '',
  propertyTypes: [],
  isSponsored: false,
  sponsorName: '',
  sponsorLogoUrl: '',
  sponsorUrl: '',
  sponsorDisclosure: '',
  adsEnabled: true,
  inlineAdAfterParagraph: 4,
  maxInlineAds: 2,
  ctaLabel: '',
  ctaUrl: '',
  isPromoted: false,
  promotedUntil: '',
  relatedPropertyIds: [],
};

const label = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted';
const input =
  'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition-colors focus:border-gold/60 placeholder:text-muted [&>option]:text-ink';

const toLocalInput = iso => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const fromLocalInput = v => (v ? new Date(v).toISOString() : undefined);

function Field({title, hint, children, className = ''}) {
  return (
    <div className={className}>
      <label className={label}>{title}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Toggle({on, onChange, title, hint}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-gold/50">
      <span
        className={`mt-0.5 grid h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
          on ? 'bg-gold' : 'bg-line'
        }`}>
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
      <span>
        <span className="block text-sm font-medium text-fg">{title}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
    </button>
  );
}

/**
 * Shown while an existing article is being fetched. It mirrors the real
 * layout — header, tab strip, editor column, sidebar — so the form doesn't
 * jump around once the data lands.
 */
function FormSkeleton() {
  const block = 'rounded-lg bg-surface2';
  return (
    <div className="relative overflow-hidden">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className={`h-7 w-40 ${block}`} />
          <div className={`mt-2 h-3 w-56 ${block} opacity-70`} />
        </div>
        <div className="flex gap-2">
          {[64, 96, 88].map((w, i) => (
            <div key={i} className={`h-10 ${block}`} style={{width: w}} />
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {[72, 116, 92, 96, 118].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-surface2" style={{width: w}} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div className={`h-2.5 w-24 ${block} opacity-70`} />
              <div className={`mt-2 h-11 w-full ${block}`} />
            </div>
          ))}
          <div>
            <div className={`h-2.5 w-32 ${block} opacity-70`} />
            <div className={`mt-2 h-72 w-full ${block}`} />
          </div>
        </div>
        <div className="space-y-5">
          <div className={`h-40 w-full ${block}`} />
          <div className={`h-24 w-full ${block}`} />
          <div className={`h-11 w-full ${block}`} />
        </div>
      </div>

      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.07] to-transparent" />
    </div>
  );
}

export default function BlogForm() {
  const {id} = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [tab, setTab] = useState('content');
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  // An edit starts out waiting for the article; a new post has nothing to wait for.
  const [loading, setLoading] = useState(Boolean(id));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  // related-listing picker
  const [propQuery, setPropQuery] = useState('');
  const [propResults, setPropResults] = useState([]);
  const [picked, setPicked] = useState([]);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  useEffect(() => {
    apiFetch('/blog/categories')
      .then(r => setCategories(r.items || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!editing) return;
    apiFetch(`/blog/${id}`)
      .then(p => {
        setForm({
          ...EMPTY,
          ...Object.fromEntries(
            Object.entries(p).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? EMPTY[k]]),
          ),
          categoryId: p.categoryId || '',
          publishedAt: toLocalInput(p.publishedAt),
          scheduledFor: toLocalInput(p.scheduledFor),
          promotedUntil: toLocalInput(p.promotedUntil),
          relatedPropertyIds: (p.relatedProperties || []).map(r => r.id),
        });
        setPicked(p.relatedProperties || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  // property search for the "related listings" tab
  useEffect(() => {
    if (!propQuery.trim()) {
      setPropResults([]);
      return;
    }
    const t = setTimeout(() => {
      apiFetch(`/properties?q=${encodeURIComponent(propQuery.trim())}&limit=6`)
        .then(r => setPropResults(r.items || []))
        .catch(() => setPropResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [propQuery]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    set('tags', [...form.tags, t]);
    setTagInput('');
  };

  async function upload(file, key, folder = 'blog') {
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadFile(file, folder);
      set(key, r.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function uploadGallery(files) {
    setUploading(true);
    try {
      for (const file of [...files]) {
        if (!file.type.startsWith('image/')) continue;
        const r = await uploadFile(file, 'blog');
        setForm(f => ({...f, imageUrls: [...f.imageUrls, r.url]}));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function togglePicked(property) {
    setPicked(prev => {
      const exists = prev.some(p => p.id === property.id);
      const next = exists ? prev.filter(p => p.id !== property.id) : [...prev, property];
      setForm(f => ({...f, relatedPropertyIds: next.map(p => p.id)}));
      return next;
    });
  }

  async function save(e, statusOverride) {
    e?.preventDefault();
    if (!form.title.trim()) {
      setError('A title is required');
      setTab('content');
      return;
    }
    setSaving(true);
    setError('');

    const status = statusOverride || form.status;
    const payload = {
      ...form,
      status,
      slug: form.slug.trim() || undefined,
      categoryId: form.categoryId || undefined,
      publishedAt: fromLocalInput(form.publishedAt),
      scheduledFor: fromLocalInput(form.scheduledFor),
      promotedUntil: fromLocalInput(form.promotedUntil),
    };
    // drop empty strings so the API keeps existing values instead of blanking them
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') delete payload[k];
    });

    try {
      if (editing) {
        await apiFetch(`/blog/${id}`, {method: 'PATCH', body: JSON.stringify(payload)});
      } else {
        await apiFetch('/blog', {method: 'POST', body: JSON.stringify(payload)});
      }
      navigate('/admin/blog');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const blocks = parseMarkdown(form.content);

  if (loading) return <FormSkeleton />;

  return (
    <form onSubmit={save}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">
            {editing ? 'Edit article' : 'New article'}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {form.content ? `${readingMinutes(form.content)} min read · ${blocks.length} blocks` : 'Markdown supported'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/blog"
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-fg">
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={e => save(e, 'draft')}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-gold hover:text-gold disabled:opacity-50">
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={e => save(e, 'published')}
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:opacity-50">
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}
      {uploading && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm text-gold">Uploading…</div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:text-fg'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── content ── */}
      {tab === 'content' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Field title="Title">
              <input className={input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Where to buy in Bhopal in 2026" />
            </Field>
            <Field title="URL slug" hint="Leave empty to generate it from the title.">
              <input className={input} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="where-to-buy-in-bhopal" />
            </Field>
            <Field title="Excerpt" hint="Shown on cards and used as the meta description fallback.">
              <textarea rows={3} className={`${input} resize-none`} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />
            </Field>

            <Field title="Body (markdown)" hint="## heading, **bold**, *italic*, - bullets, > quote, ![alt](image-url)">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreview(p => !p)}
                  className="text-xs text-muted transition-colors hover:text-gold">
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <div className="min-h-[420px] rounded-lg border border-line bg-surface p-5">
                  {blocks.map((b, i) => (
                    <p key={i} className={b.type === 'h' ? 'mt-4 font-serif text-xl text-fg' : 'mt-3 text-sm leading-relaxed text-fg/80'}>
                      {b.text || b.items?.join(' · ')}
                    </p>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={22}
                  className={`${input} font-mono text-[13px] leading-relaxed`}
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  placeholder={'## A heading\n\nA paragraph of the article…'}
                />
              )}
            </Field>
          </div>

          <div className="space-y-5">
            <Field title="Cover image">
              {form.coverImageUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-line">
                  <img src={form.coverImageUrl} alt="" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set('coverImageUrl', '')}
                    className="absolute right-2 top-2 rounded-lg bg-ink/70 px-2 py-1 text-[11px] text-white">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="grid h-40 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-sm text-muted transition-colors hover:border-gold hover:text-gold">
                  Upload cover
                  <input type="file" accept="image/*" hidden onChange={e => upload(e.target.files[0], 'coverImageUrl')} />
                </label>
              )}
            </Field>

            <Field title="In-article images" hint="Reference them in the body with ![alt](url).">
              <label className="mb-2 grid cursor-pointer place-items-center rounded-xl border border-dashed border-line py-4 text-sm text-muted transition-colors hover:border-gold hover:text-gold">
                Add images
                <input type="file" accept="image/*" multiple hidden onChange={e => uploadGallery(e.target.files)} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {form.imageUrls.map((u, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-line">
                    <img src={u} alt="" className="h-16 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(u)}
                      className="absolute inset-0 hidden place-items-center bg-ink/60 text-[10px] font-semibold text-white group-hover:grid">
                      Copy URL
                    </button>
                  </div>
                ))}
              </div>
            </Field>

            <Field title="Video URL">
              <input className={input} value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://…" />
            </Field>
          </div>
        </div>
      )}

      {/* ── taxonomy + SEO ── */}
      {tab === 'taxonomy' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Field title="Category">
              <select className={input} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field title="Tags" hint="Also used for ad targeting.">
              <div className="flex gap-2">
                <input
                  className={input}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Bhopal, Home loan…"
                />
                <button type="button" onClick={addTag} className="rounded-lg border border-line px-4 text-sm text-muted transition-colors hover:border-gold hover:text-gold">
                  Add
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {form.tags.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('tags', form.tags.filter(x => x !== t))}
                    className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-danger hover:text-danger">
                    #{t} ×
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field title="Guest author name">
                <input className={input} value={form.guestAuthorName} onChange={e => set('guestAuthorName', e.target.value)} />
              </Field>
              <Field title="Guest author avatar URL">
                <input className={input} value={form.guestAuthorAvatar} onChange={e => set('guestAuthorAvatar', e.target.value)} />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4">
              <p className={label}>Location context</p>
              <p className="mb-3 text-xs text-muted">
                Set a city to surface this article to readers in that city, and to let
                city-targeted campaigns match it.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
                <input className={input} placeholder="State" value={form.state} onChange={e => set('state', e.target.value)} />
                <input className={input} placeholder="Locality" value={form.locality} onChange={e => set('locality', e.target.value)} />
                <input className={input} placeholder="Country" value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      set(
                        'propertyTypes',
                        form.propertyTypes.includes(t)
                          ? form.propertyTypes.filter(x => x !== t)
                          : [...form.propertyTypes, t],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      form.propertyTypes.includes(t) ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Field title="Meta title" hint={`${form.metaTitle.length}/60 characters is the sweet spot.`}>
              <input className={input} value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} />
            </Field>
            <Field title="Meta description" hint={`${form.metaDescription.length}/160 characters.`}>
              <textarea rows={3} className={`${input} resize-none`} value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} />
            </Field>
            <Field title="Social share image (OG)">
              <input className={input} value={form.ogImageUrl} onChange={e => set('ogImageUrl', e.target.value)} placeholder="Defaults to the cover image" />
            </Field>
            <Field title="Canonical URL" hint="Only when this article is republished from elsewhere.">
              <input className={input} value={form.canonicalUrl} onChange={e => set('canonicalUrl', e.target.value)} />
            </Field>
            <Toggle
              on={form.noIndex}
              onChange={v => set('noIndex', v)}
              title="Hide from search engines"
              hint="Adds noindex — use for thin or duplicate pages."
            />
          </div>
        </div>
      )}

      {/* ── publishing ── */}
      {tab === 'publishing' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Field title="Status">
              <select className={input} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field title="Publish date" hint="Leave empty to use the moment you publish.">
              <input type="datetime-local" className={input} value={form.publishedAt} onChange={e => set('publishedAt', e.target.value)} />
            </Field>
            <Field title="Scheduled for" hint="Recorded for editorial planning.">
              <input type="datetime-local" className={input} value={form.scheduledFor} onChange={e => set('scheduledFor', e.target.value)} />
            </Field>
          </div>
          <div className="space-y-3">
            <Toggle on={form.featured} onChange={v => set('featured', v)} title="Featured" hint="Eligible for the lead slot on the journal index." />
            <Toggle on={form.pinned} onChange={v => set('pinned', v)} title="Pinned" hint="Always sorted to the top of the index." />
            <Toggle on={form.allowComments} onChange={v => set('allowComments', v)} title="Allow comments" hint="Readers can comment; each one still needs approval." />
          </div>
        </div>
      )}

      {/* ── advertising ── */}
      {tab === 'ads' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <Toggle
              on={form.adsEnabled}
              onChange={v => set('adsEnabled', v)}
              title="Run ads inside this article"
              hint="Turn off for advertorials, so a sponsor's story doesn't carry a rival's ad."
            />
            <div className="grid grid-cols-2 gap-4">
              <Field title="First inline ad after paragraph">
                <input type="number" min={1} max={50} className={input} value={form.inlineAdAfterParagraph} onChange={e => set('inlineAdAfterParagraph', Number(e.target.value))} />
              </Field>
              <Field title="Max inline ads">
                <input type="number" min={0} max={10} className={input} value={form.maxInlineAds} onChange={e => set('maxInlineAds', Number(e.target.value))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Field title="End CTA label">
                <input className={input} value={form.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} placeholder="Browse homes in Bhopal" />
              </Field>
              <Field title="End CTA link">
                <input className={input} value={form.ctaUrl} onChange={e => set('ctaUrl', e.target.value)} placeholder="/properties?city=Bhopal" />
              </Field>
            </div>

            <Toggle on={form.isPromoted} onChange={v => set('isPromoted', v)} title="Paid top placement" hint="Sorts above other articles until the date below." />
            {form.isPromoted && (
              <Field title="Promoted until">
                <input type="datetime-local" className={input} value={form.promotedUntil} onChange={e => set('promotedUntil', e.target.value)} />
              </Field>
            )}
          </div>

          <div className="space-y-4">
            <Toggle
              on={form.isSponsored}
              onChange={v => set('isSponsored', v)}
              title="Sponsored article (advertorial)"
              hint="Shows a Sponsored badge and a disclosure banner — required for paid editorial."
            />
            {form.isSponsored && (
              <div className="space-y-4 rounded-xl border border-gold/40 bg-gold/[0.06] p-4">
                <Field title="Sponsor name">
                  <input className={input} value={form.sponsorName} onChange={e => set('sponsorName', e.target.value)} />
                </Field>
                <Field title="Sponsor link">
                  <input className={input} value={form.sponsorUrl} onChange={e => set('sponsorUrl', e.target.value)} />
                </Field>
                <Field title="Sponsor logo">
                  {form.sponsorLogoUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={form.sponsorLogoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <button type="button" onClick={() => set('sponsorLogoUrl', '')} className="text-xs text-danger">Remove</button>
                    </div>
                  ) : (
                    <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line py-4 text-sm text-muted transition-colors hover:border-gold hover:text-gold">
                      Upload logo
                      <input type="file" accept="image/*" hidden onChange={e => upload(e.target.files[0], 'sponsorLogoUrl')} />
                    </label>
                  )}
                </Field>
                <Field title="Disclosure text" hint="Shown above the article. Be explicit about who paid for it.">
                  <textarea rows={3} className={`${input} resize-none`} value={form.sponsorDisclosure} onChange={e => set('sponsorDisclosure', e.target.value)} />
                </Field>
              </div>
            )}

            <p className="rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
              Ad units themselves are booked in{' '}
              <Link to="/admin/ads" className="text-gold">Advertising</Link> against the blog slots
              (index top, in-feed, sidebar, inline, bottom). A campaign can be limited to
              particular blog categories or tags there.
            </p>
          </div>
        </div>
      )}

      {/* ── related listings ── */}
      {tab === 'listings' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <Field title="Search properties">
              <input className={input} value={propQuery} onChange={e => setPropQuery(e.target.value)} placeholder="Bhopal, Marine Drive…" />
            </Field>
            <div className="mt-3 space-y-2">
              {propResults.map(p => {
                const on = picked.some(x => x.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePicked(p)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      on ? 'border-gold bg-gold/10' : 'border-line hover:border-gold/50'
                    }`}>
                    {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt="" className="h-10 w-14 rounded-lg object-cover" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{p.title}</span>
                      <span className="block text-xs text-muted">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="text-xs text-gold">{on ? 'Added' : 'Add'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className={label}>In this story ({picked.length})</p>
            {picked.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                No listings attached yet.
              </p>
            ) : (
              <div className="space-y-2">
                {picked.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                    {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt="" className="h-10 w-14 rounded-lg object-cover" />}
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{p.title}</span>
                    <button type="button" onClick={() => togglePicked(p)} className="text-xs text-danger">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
