import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';

const TABS = [
  {key: 'all', label: 'All'},
  {key: 'verified', label: 'Verified'},
  {key: 'pending', label: 'Pending'},
  {key: 'rejected', label: 'Rejected'},
];

const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const TYPE_COLORS = {
  apartment: '#3b82f6', villa: '#8b5cf6', plot: '#10b981',
  commercial: '#f59e0b', office: '#6366f1', shop: '#ec4899',
};

export default function AgentProperties() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/properties/mine?verification=${tab}&limit=100`)
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    if (!confirm('Delete this property?')) return;
    setBusy(id);
    try {
      await apiFetch(`/properties/${id}`, {method: 'DELETE'});
      load();
    } finally {
      setBusy(null);
    }
  }

  const badgeClass = s => (s === 'verified' ? 'badge green' : s === 'rejected' ? 'badge red' : 'badge gold');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Listings</h1>
          <p className="page-subtitle">Properties you have listed — new ones go live after admin review</p>
        </div>
        <Link to="/agent/properties/new" className="btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Property
        </Link>
      </div>

      <div className="toolbar">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn ghost sm"
            style={tab === t.key ? {borderColor: '#f2a65a', color: '#d98a3e', background: 'rgba(242,166,90,0.07)'} : undefined}>
            {t.label}
          </button>
        ))}
        <div style={{flex: 1}} />
        <span style={{fontSize: 13, color: '#a0a3b1'}}>{rows.length} {rows.length === 1 ? 'property' : 'properties'}</span>
      </div>

      {error ? <div className="error" style={{marginBottom: 16}}>{error}</div> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Property</th><th>Location</th><th>Type</th><th>Price</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length: 5}).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="skeleton-block" style={{height: 26}} /></td></tr>
              ))
            ) : rows.length ? (
              rows.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt="" style={{width: 52, height: 38, objectFit: 'cover', borderRadius: 7, border: '1px solid #e2e4eb', flexShrink: 0}} />
                      ) : (
                        <div style={{width: 52, height: 38, borderRadius: 7, background: '#f5f6fa', border: '1px solid #e2e4eb', flexShrink: 0}} />
                      )}
                      <div style={{minWidth: 0}}>
                        <div style={{fontWeight: 600, fontSize: 13.5, color: '#11111b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220}}>{p.title}</div>
                        <div style={{fontSize: 11.5, color: '#a0a3b1', marginTop: 2, textTransform: 'capitalize'}}>{p.featured ? '★ Featured · ' : ''}{p.listingType}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{color: '#636274', fontSize: 13}}>{[p.locality, p.city].filter(Boolean).join(', ') || '—'}</td>
                  <td><span style={{background: `${TYPE_COLORS[p.type] || '#6366f1'}15`, color: TYPE_COLORS[p.type] || '#6366f1', border: `1px solid ${TYPE_COLORS[p.type] || '#6366f1'}30`, borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize'}}>{p.type}</span></td>
                  <td style={{fontWeight: 600, color: '#11111b'}}>{money(p.price, p.currency)}</td>
                  <td><span className={badgeClass(p.verificationStatus)}>{p.verificationStatus}</span></td>
                  <td>
                    <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                      <Link to={`/agent/properties/${p.id}/edit`} className="btn ghost sm" style={{padding: '5px 12px', fontSize: 12}}>Edit</Link>
                      <button className="btn danger sm" disabled={busy === p.id} style={{padding: '5px 12px', fontSize: 12}} onClick={() => remove(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div style={{textAlign: 'center', padding: '40px 0', color: '#a0a3b1'}}>
                    No properties in this view. <Link to="/agent/properties/new" style={{color: '#d98a3e'}}>Add one →</Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
