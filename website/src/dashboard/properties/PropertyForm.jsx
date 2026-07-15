import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams, useLocation, Link} from 'react-router-dom';
import {gsap} from '../../lib/gsap';
import {apiFetch} from '../../lib/api';
import {uploadFile} from '../../lib/upload';

/* ── constants ─────────────────────────────────────────────────────── */
const STEPS = [
  {label: 'Basic Info', desc: 'Title, type, price and description'},
  {label: 'Location', desc: 'Address, city and coordinates'},
  {label: 'Specifications', desc: 'Size, rooms and property details'},
  {label: 'Amenities', desc: 'Features and facilities'},
  {label: 'Photos & Media', desc: 'Images, video and virtual tour'},
  {label: 'Contact Info', desc: 'Owner and agency details'},
];

const TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];
const LISTING = ['buy', 'rent'];
const FURNISH = ['unfurnished', 'semi_furnished', 'fully_furnished'];
const FACING_OPT = ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west'];
const AGES = ['Under construction', 'New (0-1 year)', '1-5 years', '5-10 years', '10+ years'];

const AMENITIES_LIST = [
  {group: 'Basics', items: ['Parking', 'Lift', 'CCTV', 'Security Guard', '24x7 Water', 'Power Backup']},
  {group: 'Fitness & Recreation', items: ['Swimming Pool', 'Gym', 'Yoga Room', 'Jogging Track', 'Club House', 'Kids Play Area']},
  {group: 'Outdoors', items: ['Garden', 'Terrace', 'Rooftop Access', 'BBQ Area', 'Pet Zone']},
  {group: 'Tech & Utilities', items: ['High-Speed WiFi', 'Smart Home', 'EV Charging', 'Solar Panels', 'Rainwater Harvesting']},
  {group: 'Convenience', items: ['Shopping Centre Nearby', 'School Nearby', 'Hospital Nearby', 'Metro Nearby', 'Airport Nearby']},
];

const NUM_FIELDS = [
  'price', 'latitude', 'longitude', 'bhk', 'bathrooms', 'balconies',
  'superBuiltUpArea', 'carpetArea', 'plotArea', 'floorNumber', 'totalFloors',
];

const EMPTY = {
  title: '', slug: '', type: 'apartment', listingType: 'buy', description: '',
  price: '', currency: 'USD', priceNegotiable: false, featured: false,
  country: 'India', state: '', city: '', locality: '', address: '', landmark: '', pincode: '',
  latitude: '', longitude: '',
  bhk: '', bathrooms: '', balconies: '', superBuiltUpArea: '', carpetArea: '', plotArea: '',
  floorNumber: '', totalFloors: '', propertyAge: '', furnishing: '', facing: '',
  amenities: [], imageUrls: [], videoUrl: '', virtualTourUrl: '', modelUrl: '', brochureUrl: '',
  ownerName: '', ownerPhone: '', ownerWhatsapp: '', ownerEmail: '', agencyName: '',
};

const slugify = s =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

const fmt = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/* ── reusable field components ──────────────────────────────────────── */
const inputCls = {
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e2e4eb',
    borderRadius: 9,
    fontSize: 13.5,
    color: '#11111b',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    outline: 'none',
  },
};

function FormInput({label, hint, children}) {
  return (
    <div>
      {label && (
        <label style={{display: 'block', fontSize: 12, fontWeight: 700, color: '#636274', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6}}>
          {label}
        </label>
      )}
      {children}
      {hint && <p style={{fontSize: 11.5, color: '#a0a3b1', marginTop: 5}}>{hint}</p>}
    </div>
  );
}

function Input({label, hint, value, onChange, type = 'text', placeholder, required}) {
  const [focus, setFocus] = useState(false);
  return (
    <FormInput label={label} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          ...inputCls.input,
          borderColor: focus ? '#f2a65a' : '#e2e4eb',
          boxShadow: focus ? '0 0 0 3px rgba(242,166,90,0.12)' : 'none',
        }}
      />
    </FormInput>
  );
}

function Textarea({label, hint, value, onChange, placeholder, rows = 4}) {
  const [focus, setFocus] = useState(false);
  return (
    <FormInput label={label} hint={hint}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          ...inputCls.input,
          resize: 'vertical',
          lineHeight: 1.6,
          borderColor: focus ? '#f2a65a' : '#e2e4eb',
          boxShadow: focus ? '0 0 0 3px rgba(242,166,90,0.12)' : 'none',
        }}
      />
    </FormInput>
  );
}

function Select({label, hint, value, onChange, options, placeholder = 'Select…'}) {
  const [focus, setFocus] = useState(false);
  return (
    <FormInput label={label} hint={hint}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          ...inputCls.input,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a3b1' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 36,
          cursor: 'pointer',
          borderColor: focus ? '#f2a65a' : '#e2e4eb',
          boxShadow: focus ? '0 0 0 3px rgba(242,166,90,0.12)' : 'none',
        }}>
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o}>{fmt(o)}</option>
        ))}
      </select>
    </FormInput>
  );
}

function Toggle({label, desc, checked, onChange}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: `1.5px solid ${checked ? 'rgba(242,166,90,0.4)' : '#e2e4eb'}`,
        borderRadius: 10,
        background: checked ? 'rgba(242,166,90,0.05)' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.18s',
      }}>
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: checked ? '#f2a65a' : '#e2e4eb',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute',
          top: 3, width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          left: checked ? 21 : 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <div>
        <div style={{fontSize: 13.5, fontWeight: 600, color: '#11111b'}}>{label}</div>
        {desc && <div style={{fontSize: 11.5, color: '#a0a3b1', marginTop: 1}}>{desc}</div>}
      </div>
    </button>
  );
}

/* ── section wrapper ─────────────────────────────────────────────────── */
function Section({title, children}) {
  return (
    <div style={{marginBottom: 28}}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#a0a3b1',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: 14, paddingBottom: 10,
          borderBottom: '1px solid #f0f1f5',
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Grid({cols = 2, children}) {
  return (
    <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px 20px'}}>
      {children}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────── */
export default function PropertyForm() {
  const {id} = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const {pathname} = useLocation();
  // Keep each role inside its own area when navigating (breadcrumb + post-save).
  const base = pathname.startsWith('/agent')
    ? '/agent/properties'
    : pathname.startsWith('/account')
      ? '/account/properties'
      : '/admin/properties';
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const stepRef = useRef(null);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  useEffect(() => {
    if (editing) {
      apiFetch(`/properties/${id}`)
        .then(p => {
          const next = {...EMPTY};
          Object.keys(EMPTY).forEach(k => { if (p[k] != null) next[k] = p[k]; });
          setForm(next);
          setSlugTouched(true);
        })
        .catch(e => setError(e.message));
      return;
    }
    // New listing: prefill the basic details chosen on the public "Post Property" page.
    try {
      const raw = sessionStorage.getItem('rr_post_intent');
      if (raw) {
        const intent = JSON.parse(raw);
        const allowed = Object.fromEntries(
          Object.entries(intent).filter(([k, v]) => k in EMPTY && v != null && v !== ''),
        );
        if (Object.keys(allowed).length) setForm(f => ({...f, ...allowed}));
        sessionStorage.removeItem('rr_post_intent');
      }
    } catch { /* ignore malformed intent */ }
  }, [id, editing]);

  useEffect(() => {
    if (!slugTouched) setForm(f => ({...f, slug: slugify(f.title)}));
  }, [form.title, slugTouched]);

  useEffect(() => {
    if (stepRef.current) {
      gsap.fromTo(stepRef.current, {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.35, ease: 'power2.out'});
    }
  }, [step]);

  function toggleAmenity(a) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  }

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of [...files]) {
        if (!file.type.startsWith('image/')) continue;
        const r = await uploadFile(file, 'properties');
        setForm(f => ({...f, imageUrls: [...f.imageUrls, r.url]}));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSingle(file, key, folder) {
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

  async function handleBrochure(file) {
    if (!file) return;
    // `accept` only filters the picker — the user can still force any file through.
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return setError('Brochure must be a PDF file.');
    setError('');
    await handleSingle(file, 'brochureUrl', 'property-brochures');
  }

  function validateStep() {
    if (step === 0) {
      if (!form.title.trim()) return 'Property title is required.';
      if (!form.price || Number(form.price) <= 0) return 'Enter a valid price.';
    }
    return '';
  }

  function next() {
    const err = validateStep();
    if (err) return setError(err);
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    const err = validateStep();
    if (err) { setStep(0); return setError(err); }
    setSaving(true);
    setError('');
    const payload = {...form};
    NUM_FIELDS.forEach(k => {
      payload[k] = payload[k] === '' || payload[k] == null ? undefined : Number(payload[k]);
    });
    ['furnishing', 'facing', 'listingType', 'propertyAge', 'slug'].forEach(k => {
      if (payload[k] === '') payload[k] = undefined;
    });
    try {
      if (editing) await apiFetch(`/properties/${id}`, {method: 'PATCH', body: JSON.stringify(payload)});
      else await apiFetch('/properties', {method: 'POST', body: JSON.stringify(payload)});
      navigate(base);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  /* ── render helpers ─ */
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ margin: '0 auto'}}>
      {/* ── Page header ── */}
      <div style={{marginBottom: 28}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#a0a3b1'}}>
          <Link to={base} style={{color: '#a0a3b1', textDecoration: 'none'}}>Properties</Link>
          <span>›</span>
          <span style={{color: '#11111b'}}>{editing ? 'Edit Property' : 'New Property'}</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
          <h1 style={{marginBottom: 0}}>{editing ? 'Edit Property' : 'Add New Property'}</h1>
          <span style={{fontSize: 13, color: '#a0a3b1'}}>Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      {/* ── Step Wizard ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e4eb',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* progress bar */}
        <div style={{height: 4, background: '#f0f1f5', borderRadius: 99, marginBottom: 20, overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #f2a65a, #d98a3e)', borderRadius: 99, transition: 'width 0.4s ease'}} />
        </div>

        {/* step dots */}
        <div style={{display: 'flex', gap: 8}}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => i <= step && setStep(i)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: i <= step ? 'pointer' : 'default',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                }}>
                <div style={{
                  width: 30, height: 30,
                  borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: done ? '#10b981' : active ? '#f2a65a' : '#f0f1f5',
                  color: done || active ? '#fff' : '#a0a3b1',
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 4px 12px rgba(242,166,90,0.35)' : 'none',
                }}>
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i + 1}
                </div>
                <span style={{fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? '#d98a3e' : done ? '#10b981' : '#a0a3b1', textAlign: 'center', lineHeight: 1.2, display: 'none'}}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* current step title */}
        <div style={{marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f1f5', display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(242,166,90,0.1)',
            color: '#d98a3e',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <span style={{fontWeight: 800, fontSize: 15}}>{step + 1}</span>
          </div>
          <div>
            <div style={{fontWeight: 700, fontSize: 15, color: '#11111b'}}>{STEPS[step].label}</div>
            <div style={{fontSize: 12.5, color: '#a0a3b1', marginTop: 1}}>{STEPS[step].desc}</div>
          </div>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div ref={stepRef} style={{
        background: '#fff',
        border: '1px solid #e2e4eb',
        borderRadius: 14,
        padding: '28px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: 20,
      }}>

        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <div>
            <Section title="Listing Details">
              <div style={{marginBottom: 16}}>
                <Input
                  label="Property Title *"
                  placeholder="e.g. Spacious 3BHK Apartment with Sea View in Bandra West"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  required
                />
              </div>
              <div style={{marginBottom: 16}}>
                <Input
                  label="URL Slug"
                  hint="Auto-generated from title. Edit to customise the property URL."
                  placeholder="spacious-3bhk-bandra-west"
                  value={form.slug}
                  onChange={e => { setSlugTouched(true); set('slug', e.target.value); }}
                />
              </div>
              <Grid cols={2}>
                <Select label="Property Type *" value={form.type} onChange={e => set('type', e.target.value)} options={TYPES} placeholder="" />
                <Select label="Listing Type *" value={form.listingType} onChange={e => set('listingType', e.target.value)} options={LISTING} placeholder="" />
              </Grid>
            </Section>

            <Section title="Description">
              <Textarea
                label="Property Description"
                placeholder="Describe the property — its highlights, neighbourhood, nearby landmarks, key selling points…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
              />
            </Section>

            <Section title="Pricing">
              <Grid cols={2}>
                <div style={{gridColumn: 'span 1'}}>
                  <Input
                    label="Price *"
                    type="number"
                    placeholder="e.g. 9500000"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                  />
                </div>
                <Select label="Currency" value={form.currency} onChange={e => set('currency', e.target.value)} options={['USD', 'INR', 'AED', 'GBP', 'EUR', 'SGD']} placeholder="" />
              </Grid>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginTop: 14}}>
                <Toggle
                  label="Price Negotiable"
                  desc="Buyers can negotiate the listed price"
                  checked={form.priceNegotiable}
                  onChange={v => set('priceNegotiable', v)}
                />
                <Toggle
                  label="Featured Listing"
                  desc="Highlight this property across the platform"
                  checked={form.featured}
                  onChange={v => set('featured', v)}
                />
              </div>
            </Section>
          </div>
        )}

        {/* ── Step 1: Location ── */}
        {step === 1 && (
          <div>
            <Section title="Region">
              <Grid cols={2}>
                <Input label="Country" value={form.country} onChange={e => set('country', e.target.value)} placeholder="India" />
                <Input label="State / Province" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
                <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                <Input label="Locality / Area" value={form.locality} onChange={e => set('locality', e.target.value)} placeholder="Bandra West" />
              </Grid>
            </Section>

            <Section title="Address">
              <div style={{marginBottom: 16}}>
                <Input label="Full Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Building name, street, locality…" />
              </div>
              <Grid cols={2}>
                <Input label="Landmark" value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder="Near Bandra Station" />
                <Input label="Pincode / Postal Code" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="400050" />
              </Grid>
            </Section>

            <Section title="Coordinates (optional)">
              <Grid cols={2}>
                <Input label="Latitude" type="number" placeholder="19.0596" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
                <Input label="Longitude" type="number" placeholder="72.8295" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
              </Grid>
              {form.latitude && form.longitude && (
                <div style={{marginTop: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e4eb'}}>
                  <iframe
                    title="map"
                    style={{width: '100%', height: 200, display: 'block', border: 'none'}}
                    src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
                  />
                </div>
              )}
              <p style={{fontSize: 11.5, color: '#a0a3b1', marginTop: 10}}>
                Tip: right-click any location in Google Maps and copy the coordinates.
              </p>
            </Section>
          </div>
        )}

        {/* ── Step 2: Specifications ── */}
        {step === 2 && (
          <div>
            <Section title="Rooms">
              <Grid cols={3}>
                <Input label="BHK" type="number" placeholder="3" value={form.bhk} onChange={e => set('bhk', e.target.value)} />
                <Input label="Bathrooms" type="number" placeholder="2" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
                <Input label="Balconies" type="number" placeholder="1" value={form.balconies} onChange={e => set('balconies', e.target.value)} />
              </Grid>
            </Section>

            <Section title="Area">
              <Grid cols={3}>
                <Input label="Super Built-up (sqft)" type="number" placeholder="1450" value={form.superBuiltUpArea} onChange={e => set('superBuiltUpArea', e.target.value)} />
                <Input label="Carpet Area (sqft)" type="number" placeholder="1100" value={form.carpetArea} onChange={e => set('carpetArea', e.target.value)} />
                <Input label="Plot Area (sqft)" type="number" placeholder="0" value={form.plotArea} onChange={e => set('plotArea', e.target.value)} />
              </Grid>
            </Section>

            <Section title="Building">
              <Grid cols={3}>
                <Input label="Floor Number" type="number" placeholder="8" value={form.floorNumber} onChange={e => set('floorNumber', e.target.value)} />
                <Input label="Total Floors" type="number" placeholder="22" value={form.totalFloors} onChange={e => set('totalFloors', e.target.value)} />
                <Select label="Property Age" value={form.propertyAge} onChange={e => set('propertyAge', e.target.value)} options={AGES} />
              </Grid>
            </Section>

            <Section title="Interior">
              <Grid cols={2}>
                <Select label="Furnishing Status" value={form.furnishing} onChange={e => set('furnishing', e.target.value)} options={FURNISH} />
                <Select label="Facing Direction" value={form.facing} onChange={e => set('facing', e.target.value)} options={FACING_OPT} />
              </Grid>
            </Section>
          </div>
        )}

        {/* ── Step 3: Amenities ── */}
        {step === 3 && (
          <div>
            {form.amenities.length > 0 && (
              <div style={{
                background: 'rgba(242,166,90,0.06)',
                border: '1px solid rgba(242,166,90,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d98a3e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{fontSize: 13, color: '#d98a3e', fontWeight: 600}}>
                  {form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected
                </span>
              </div>
            )}
            {AMENITIES_LIST.map(group => (
              <Section key={group.group} title={group.group}>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 9}}>
                  {group.items.map(a => {
                    const on = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${on ? '#f2a65a' : '#e2e4eb'}`,
                          background: on ? 'rgba(242,166,90,0.08)' : '#fff',
                          color: on ? '#d98a3e' : '#636274',
                          fontSize: 13,
                          fontWeight: on ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                        {on && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {a}
                      </button>
                    );
                  })}
                </div>
              </Section>
            ))}
          </div>
        )}

        {/* ── Step 4: Media ── */}
        {step === 4 && (
          <div>
            <Section title="Property Photos">
              {/* drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                style={{
                  border: `2px dashed ${dragOver ? '#f2a65a' : '#e2e4eb'}`,
                  borderRadius: 12,
                  background: dragOver ? 'rgba(242,166,90,0.04)' : '#fafafa',
                  padding: '32px 24px',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  marginBottom: 18,
                }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, background: '#f0f1f5',
                  display: 'grid', placeItems: 'center', margin: '0 auto 14px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{fontSize: 13.5, color: '#11111b', fontWeight: 600, marginBottom: 4}}>
                  {dragOver ? 'Drop photos here' : 'Drag & drop property photos'}
                </p>
                <p style={{fontSize: 12, color: '#a0a3b1', marginBottom: 14}}>PNG, JPG, WEBP up to 10MB each</p>
                <label style={{cursor: 'pointer'}}>
                  <span style={{
                    display: 'inline-block',
                    padding: '9px 20px',
                    background: '#f2a65a',
                    color: '#211d1d',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}>
                    {uploading ? 'Uploading…' : 'Browse Photos'}
                  </span>
                  <input type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
                </label>
              </div>

              {/* image grid */}
              {form.imageUrls.length > 0 && (
                <div>
                  <p style={{fontSize: 12, color: '#a0a3b1', marginBottom: 10}}>{form.imageUrls.length} photo{form.imageUrls.length > 1 ? 's' : ''} added</p>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
                    {form.imageUrls.map((u, i) => (
                      <div key={u} style={{position: 'relative', aspectRatio: '4/3', borderRadius: 9, overflow: 'hidden', border: '1px solid #e2e4eb'}}>
                        <img src={u} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        {i === 0 && (
                          <div style={{position: 'absolute', bottom: 5, left: 5, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase'}}>
                            Cover
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => set('imageUrls', form.imageUrls.filter((_, j) => j !== i))}
                          style={{
                            position: 'absolute', top: 5, right: 5,
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)', color: '#fff',
                            border: 'none', cursor: 'pointer',
                            display: 'grid', placeItems: 'center', fontSize: 13, lineHeight: 1,
                          }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Video & Virtual Tour">
              <Grid cols={2}>
                <div>
                  <label style={{display: 'block', fontSize: 12, fontWeight: 700, color: '#636274', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6}}>Property Video</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: '1.5px dashed #e2e4eb',
                    borderRadius: 9, cursor: 'pointer', background: '#fafafa',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.899L15 14M4 8h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/></svg>
                    <span style={{fontSize: 13, color: '#636274'}}>{form.videoUrl ? 'Change video' : 'Upload video'}</span>
                    <input type="file" accept="video/*" hidden onChange={e => handleSingle(e.target.files[0], 'videoUrl', 'property-videos')} />
                  </label>
                  {form.videoUrl && <p style={{fontSize: 11.5, color: '#10b981', marginTop: 6, wordBreak: 'break-all'}}>✓ Video uploaded</p>}
                </div>
                <div>
                  <label style={{display: 'block', fontSize: 12, fontWeight: 700, color: '#636274', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6}}>3D Model (.glb)</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: '1.5px dashed #e2e4eb',
                    borderRadius: 9, cursor: 'pointer', background: '#fafafa',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    <span style={{fontSize: 13, color: '#636274'}}>{form.modelUrl ? 'Change model' : 'Upload 3D model'}</span>
                    <input type="file" accept=".glb,.gltf" hidden onChange={e => handleSingle(e.target.files[0], 'modelUrl', 'property-3d')} />
                  </label>
                  {form.modelUrl && <p style={{fontSize: 11.5, color: '#10b981', marginTop: 6}}>✓ 3D model uploaded</p>}
                </div>
              </Grid>
              <div style={{marginTop: 16}}>
                <Grid cols={2}>
                  <Input label="360° Virtual Tour URL" placeholder="https://my360tour.com/property/xyz" value={form.virtualTourUrl} onChange={e => set('virtualTourUrl', e.target.value)} />
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 700, color: '#636274', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6}}>Brochure (PDF) — optional</label>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', border: '1.5px dashed #e2e4eb',
                      borderRadius: 9, cursor: 'pointer', background: '#fafafa',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>
                      <span style={{fontSize: 13, color: '#636274'}}>{form.brochureUrl ? 'Change brochure' : 'Upload brochure'}</span>
                      <input type="file" accept="application/pdf,.pdf" hidden onChange={e => handleBrochure(e.target.files[0])} />
                    </label>
                    {form.brochureUrl && (
                      <p style={{fontSize: 11.5, color: '#10b981', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8}}>
                        ✓ Brochure uploaded
                        <a href={form.brochureUrl} target="_blank" rel="noreferrer" style={{color: '#636274', textDecoration: 'underline'}}>preview</a>
                        <button
                          type="button"
                          onClick={() => set('brochureUrl', '')}
                          style={{border: 0, background: 'none', color: '#e0654f', cursor: 'pointer', padding: 0, fontSize: 11.5}}>
                          remove
                        </button>
                      </p>
                    )}
                  </div>
                </Grid>
              </div>
            </Section>
          </div>
        )}

        {/* ── Step 5: Contact Info ── */}
        {step === 5 && (
          <div>
            <Section title="Owner Details">
              <Grid cols={2}>
                <Input label="Owner / Contact Name" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="Full name" />
                <Input label="Agency / Company Name" value={form.agencyName} onChange={e => set('agencyName', e.target.value)} placeholder="e.g. ABC Realty" />
              </Grid>
            </Section>

            <Section title="Contact Numbers">
              <Grid cols={2}>
                <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} />
                <Input label="WhatsApp Number" type="tel" placeholder="+91 98765 43210" value={form.ownerWhatsapp} onChange={e => set('ownerWhatsapp', e.target.value)} hint="Leave blank if same as phone" />
              </Grid>
            </Section>

            <Section title="Email">
              <div style={{maxWidth: 400}}>
                <Input label="Email Address" type="email" placeholder="contact@agency.com" value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)} />
              </div>
            </Section>

            {/* summary before publish */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e2e4eb',
              borderRadius: 12,
              padding: '18px 22px',
              marginTop: 8,
            }}>
              <p style={{fontSize: 13, fontWeight: 700, color: '#11111b', marginBottom: 12}}>Listing Summary</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px'}}>
                {[
                  ['Title', form.title || '—'],
                  ['Type', form.type],
                  ['Price', form.price ? `$${Number(form.price).toLocaleString()}` : '—'],
                  ['City', form.city || '—'],
                  ['BHK', form.bhk || '—'],
                  ['Photos', `${form.imageUrls.length} uploaded`],
                  ['Brochure', form.brochureUrl ? 'Attached' : 'None'],
                ].map(([k, v]) => (
                  <div key={k} style={{display: 'flex', gap: 8, alignItems: 'baseline'}}>
                    <span style={{fontSize: 12, color: '#a0a3b1', minWidth: 56}}>{k}</span>
                    <span style={{fontSize: 13, fontWeight: 600, color: '#11111b', textTransform: 'capitalize'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(224,101,79,0.06)',
          border: '1px solid rgba(224,101,79,0.3)',
          borderRadius: 10, padding: '12px 16px',
          marginBottom: 16,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e0654f" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{fontSize: 13.5, color: '#c0392b'}}>{error}</span>
        </div>
      )}

      {/* ── Footer Actions ── */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'rgba(245,246,250,0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #e2e4eb',
        padding: '14px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        zIndex: 10,
      }}>
        <button
          type="button"
          className="btn ghost"
          onClick={() => step === 0 ? navigate(base) : setStep(s => s - 1)}>
          {step === 0 ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Cancel
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Previous
            </>
          )}
        </button>

        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {/* step dots */}
          <div style={{display: 'flex', gap: 5}}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 18 : 6,
                height: 6,
                borderRadius: 99,
                background: i === step ? '#f2a65a' : i < step ? '#10b981' : '#e2e4eb',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <button type="button" className="btn" onClick={next} style={{minWidth: 110}}>
              Next Step
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={submit}
              disabled={saving || uploading}
              style={{minWidth: 140, background: saving ? '#d98a3e' : undefined}}>
              {saving ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation: 'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  {editing ? 'Update Property' : 'Publish Listing'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
