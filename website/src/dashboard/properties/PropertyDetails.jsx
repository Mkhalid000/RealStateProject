import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const money = (p, c) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: c || 'USD', maximumFractionDigits: 0 }).format(Number(p) || 0);

const fmt = s => (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATUS = {
  verified: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  rejected: 'bg-red-50 text-red-600',
};
const TYPE_COLORS = {
  apartment: '#3b82f6', villa: '#8b5cf6', plot: '#10b981',
  commercial: '#f59e0b', office: '#6366f1', shop: '#ec4899',
};

/* ── inline icons ── */
const I = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" /><path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></>,
  bath: <><path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM7 20l-1 2M18 20l1 2" /></>,
  ruler: <><path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7.5 10.5l2 2M11 7l2 2M14.5 3.5l2 2" /></>,
  balcony: <><rect x="3" y="3" width="18" height="8" rx="1" /><path d="M5 11v10M19 11v10M9 11v10M15 11v10M3 16h18" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
  star: <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></>,
  whatsapp: <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.9 12l-.3.5.7 2.5-2.6-.7-.5.3A8 8 0 1 1 12 4zm-2.5 4c-.2 0-.5 0-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.2.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.6-.8c-.2-.1-.4-.1-.6.1l-.6.8c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.3 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.3 0-.4l-.8-1.9c-.2-.4-.4-.4-.6-.4z" />,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></>,
  tag: <><path d="M12 2l9 9-9 9-9-9z" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  video: <><path d="M15 10l4.5-2.6A1 1 0 0 1 21 8.3v7.4a1 1 0 0 1-1.5.9L15 14M4 8h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" /></>,
  cube: <><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.3 7 12 12l8.7-5M12 22V12" /></>,
  tour: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></>,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  chevL: <path d="M15 18l-6-6 6-6" />,
  chevR: <path d="M9 18l6-6-6-6" />,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>,
};
const Svg = ({ d, size = 16, sw = 1.7, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

function Fact({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-gold/50 hover:shadow-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: `${color}15`, color }}>
        <Svg d={icon} size={17} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
        <div className="text-[15px] font-semibold text-fg">{value}</div>
      </div>
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
        {icon && <span className="text-gold-dark"><Svg d={icon} size={15} /></span>}
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value, href, icon }) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-sm text-muted">
        {icon && <Svg d={icon} size={14} />}{label}
      </span>
      <span className={`text-right text-sm font-medium ${href ? 'text-gold-dark hover:underline' : 'text-fg'}`}>{value || '—'}</span>
    </>
  );
  return href && value ? (
    <a href={href} className="flex items-center justify-between gap-4 py-2.5">{content}</a>
  ) : (
    <div className="flex items-center justify-between gap-4 py-2.5">{content}</div>
  );
}

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState(false); // lightbox open
  const [menuEl, setMenuEl] = useState(null); // action menu anchor

  function load() {
    setLoading(true);
    apiFetch(`/properties/${id}`)
      .then(p => { setP(p); setActive(0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  const images = p?.imageUrls?.length ? p.imageUrls : [];
  const next = useCallback(() => setActive(i => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length]);

  // keyboard nav for the lightbox
  useEffect(() => {
    if (!preview) return;
    const onKey = e => {
      if (e.key === 'Escape') setPreview(false);
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview, next, prev]);

  async function setVerification(verificationStatus) {
    setBusy(true);
    try {
      await apiFetch(`/properties/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verificationStatus }) });
      load();
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    setBusy(true);
    try {
      await apiFetch(`/properties/${id}`, { method: 'DELETE' });
      navigate('/admin/properties');
    } finally { setBusy(false); }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="h-9 w-28 animate-pulse rounded-lg bg-neutral-200/70" />
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-[380px] animate-pulse rounded-2xl bg-neutral-200/70" />
          <div className="h-[380px] animate-pulse rounded-2xl bg-neutral-200/70" />
        </div>
      </div>
    );
  }
  if (error || !p) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted">{error || 'Property not found.'}</p>
        <button onClick={() => navigate('/admin/properties')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-dark">
          <Svg d={I.back} size={15} /> Back to Properties
        </button>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[p.type] || '#6366f1';
  const area = p.carpetArea ?? p.superBuiltUpArea ?? p.plotArea;
  const agency = p.agencyName || p.agent?.socialLinks?.agency;
  const waNumber = (p.ownerWhatsapp || '').replace(/[^0-9]/g, '');

  return (
    <div className="mx-auto max-w-6xl">
      {/* header: back + title + actions menu (single aligned row) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => navigate('/admin/properties')}
            aria-label="Back to properties"
            className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg transition hover:border-gold hover:text-gold-dark">
            <Svg d={I.back} size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-2xl font-bold leading-tight tracking-tight text-fg">{p.title}</h1>

            </div>
          </div>
        </div>

        {/* status + actions grouped together */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[p.verificationStatus] || 'bg-neutral-100 text-neutral-500'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> {p.verificationStatus}
          </span>
          {p.featured && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark">
              <Svg d={I.star} size={12} fill="currentColor" sw={0} /> Featured
            </span>
          )}
          <IconButton
            onClick={e => setMenuEl(e.currentTarget)}
            disabled={busy}
            aria-label="Actions"
            sx={{ flexShrink: 0, border: '1px solid #e2e4eb', borderRadius: '10px', width: 40, height: 40 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636274" strokeWidth="2"><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></svg>
          </IconButton>
          <Menu
            anchorEl={menuEl}
            open={Boolean(menuEl)}
            onClose={() => setMenuEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ '& .MuiPaper-root': { minWidth: 160, borderRadius: '12px', border: '1px solid #e2e4eb', boxShadow: '0 12px 32px rgba(0,0,0,0.12)' } }}>
            <MenuItem onClick={() => { setMenuEl(null); navigate(`/admin/properties/${id}/edit`); }} sx={{ fontSize: 14, gap: 1.2 }}>
              <Svg d={I.edit} size={15} /> Edit
            </MenuItem>
            {p.verificationStatus !== 'verified' && (
              <MenuItem onClick={() => { setMenuEl(null); setVerification('verified'); }} sx={{ fontSize: 14, gap: 1.2, color: '#10b981' }}>
                <Svg d={I.check} size={15} sw={2.4} /> Verify
              </MenuItem>
            )}
            {p.verificationStatus !== 'rejected' && (
              <MenuItem onClick={() => { setMenuEl(null); setVerification('rejected'); }} sx={{ fontSize: 14, gap: 1.2, color: '#d98a3e' }}>
                <Svg d={I.x} size={15} sw={2.2} /> Reject
              </MenuItem>
            )}
            <MenuItem onClick={() => { setMenuEl(null); remove(); }} sx={{ fontSize: 14, gap: 1.2, color: '#e0654f' }}>
              <Svg d={I.trash} size={15} /> Delete
            </MenuItem>
          </Menu>
        </div>
      </div>
      <p className=" flex items-center gap-1.5 text-sm text-muted mb-2">
        <Svg d={I.pin} size={14} /> {[p.locality, p.city, p.state].filter(Boolean).join(', ') || 'Location not set'}
      </p>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* gallery */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <button
              type="button"
              onClick={() => images.length && setPreview(true)}
              className="group relative block aspect-[16/10] w-full bg-bg">
              {images.length ? (
                <>
                  <img src={images[active]} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow">
                      <Svg d={I.expand} size={15} /> Preview
                    </span>
                  </div>
                  <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                    {active + 1} / {images.length}
                  </span>
                </>
              ) : (
                <div className="grid h-full place-items-center text-neutral-300">
                  <Svg d={I.doc} size={46} sw={1.2} />
                </div>
              )}
            </button>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === active ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* key facts */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {p.bhk != null && <Fact icon={I.bed} label="Bedrooms" value={`${p.bhk} BHK`} color="#3b82f6" />}
            {p.bathrooms != null && <Fact icon={I.bath} label="Bathrooms" value={p.bathrooms} color="#8b5cf6" />}
            {area != null && <Fact icon={I.ruler} label="Area" value={`${area} sqft`} color="#10b981" />}
            {p.balconies != null && <Fact icon={I.balcony} label="Balconies" value={p.balconies} color="#f59e0b" />}
          </div>

          <Card icon={I.doc} title="Description">
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg/90">
              {p.description || 'No description provided.'}
            </p>
          </Card>

          <Card icon={I.list} title="Specifications">
            <div className="grid gap-x-10 sm:grid-cols-2">
              <div className="divide-y divide-line">
                <Row label="Super built-up" value={p.superBuiltUpArea ? `${p.superBuiltUpArea} sqft` : null} />
                <Row label="Carpet area" value={p.carpetArea ? `${p.carpetArea} sqft` : null} />
                <Row label="Plot area" value={p.plotArea ? `${p.plotArea} sqft` : null} />
                <Row label="Floor" value={p.floorNumber != null ? `${p.floorNumber}${p.totalFloors ? ` of ${p.totalFloors}` : ''}` : null} />
              </div>
              <div className="divide-y divide-line">
                <Row label="Furnishing" value={fmt(p.furnishing)} />
                <Row label="Facing" value={fmt(p.facing)} />
                <Row label="Property age" value={p.propertyAge} />
                <Row label="Listing type" value={fmt(p.listingType)} />
              </div>
            </div>
          </Card>

          {p.amenities?.length > 0 && (
            <Card icon={I.check} title="Amenities">
              <div className="flex flex-wrap gap-2">
                {p.amenities.map(a => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-sm text-fg">
                    <span className="text-emerald-500"><Svg d={I.check} size={13} sw={2.4} /></span>{a}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {p.latitude && p.longitude && (
            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe title="map" className="h-64 w-full border-0"
                src={`https://maps.google.com/maps?q=${p.latitude},${p.longitude}&z=15&output=embed`} />
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-gradient-to-br from-[#1a1816] to-[#2d2828] p-6 text-white">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/55">Price</div>
            <div className="mt-1 font-serif text-3xl font-bold text-gold-light">{money(p.price, p.currency)}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
              {p.priceNegotiable ? 'Negotiable' : 'Fixed price'} ·
              <span className="font-semibold capitalize" style={{ color: typeColor }}>{p.type}</span>
            </div>
          </div>

          <Card icon={I.pin} title="Location">
            <div className="divide-y divide-line">
              <Row label="Address" value={p.address} />
              <Row label="Locality" value={p.locality} />
              <Row label="City" value={p.city} />
              <Row label="State" value={p.state} />
              <Row label="Country" value={p.country} />
              <Row label="Pincode" value={p.pincode} />
              <Row label="Landmark" value={p.landmark} />
            </div>
          </Card>

          <Card icon={I.user} title="Owner / Agent">
            <div className="divide-y divide-line">
              <Row icon={I.user} label="Owner" value={p.ownerName} />
              <Row icon={I.building} label="Agency" value={agency} />
              <Row icon={I.phone} label="Phone" value={p.ownerPhone} href={p.ownerPhone ? `tel:${p.ownerPhone}` : undefined} />
              <Row icon={I.whatsapp} label="WhatsApp" value={p.ownerWhatsapp} href={waNumber ? `https://wa.me/${waNumber}` : undefined} />
              <Row icon={I.mail} label="Email" value={p.ownerEmail} href={p.ownerEmail ? `mailto:${p.ownerEmail}` : undefined} />
              <Row icon={I.user} label="Listed by" value={p.agent?.fullName || p.agent?.email} />
            </div>
          </Card>

          {(p.videoUrl || p.virtualTourUrl || p.modelUrl) && (
            <Card icon={I.video} title="Media">
              <div className="flex flex-col gap-2.5">
                {p.videoUrl && <a href={p.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark hover:underline"><Svg d={I.video} size={15} /> Property video</a>}
                {p.virtualTourUrl && <a href={p.virtualTourUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark hover:underline"><Svg d={I.tour} size={15} /> 360° virtual tour</a>}
                {p.modelUrl && <a href={p.modelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark hover:underline"><Svg d={I.cube} size={15} /> 3D model</a>}
              </div>
            </Card>
          )}

          <Card icon={I.info} title="Meta">
            <div className="divide-y divide-line">
              <Row label="Slug" value={p.slug} />
              <Row label="Status" value={fmt(p.status)} />
              <Row label="Created" value={fmtDate(p.createdAt)} />
            </div>
          </Card>
        </div>
      </div>

      {/* ── Lightbox preview ── */}
      {preview && images.length > 0 && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(false)}>
          <button onClick={() => setPreview(false)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close">
            <Svg d={I.close} size={22} sw={2} />
          </button>
          <span className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">{active + 1} / {images.length}</span>

          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Previous">
              <Svg d={I.chevL} size={26} sw={2} />
            </button>
          )}

          <img src={images[active]} alt="" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" onClick={e => e.stopPropagation()} />

          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Next">
              <Svg d={I.chevR} size={26} sw={2} />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto" onClick={e => e.stopPropagation()}>
              {images.map((src, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition ${i === active ? 'border-gold' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
