import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {BarChart} from '@mui/x-charts/BarChart';

const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const TYPE_COLORS = {
  apartment: '#3b82f6', villa: '#8b5cf6', plot: '#10b981',
  commercial: '#f59e0b', office: '#6366f1', shop: '#ec4899',
};

const chartSx = {
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {stroke: '#e2e4eb'},
  '& .MuiChartsAxis-tickLabel': {fill: '#a0a3b1 !important', fontFamily: 'Inter, sans-serif', fontSize: '11px'},
};

const STAT_META = [
  {key: 'total', label: 'Total Listings', color: '#3b82f6'},
  {key: 'verified', label: 'Verified (Live)', color: '#10b981'},
  {key: 'pending', label: 'Pending Review', color: '#f2a65a'},
  {key: 'rejected', label: 'Rejected', color: '#e0654f'},
];

export default function AgentOverview() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/properties/mine?limit=100')
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    total: rows.length,
    verified: rows.filter(p => p.verificationStatus === 'verified').length,
    pending: rows.filter(p => p.verificationStatus === 'pending').length,
    rejected: rows.filter(p => p.verificationStatus === 'rejected').length,
  }), [rows]);

  const byType = useMemo(() => {
    const c = {};
    rows.forEach(p => { c[p.type] = (c[p.type] || 0) + 1; });
    return Object.entries(c).map(([label, value]) => ({label, value, color: TYPE_COLORS[label] || '#6366f1'}));
  }, [rows]);

  const totalValue = rows.reduce((s, p) => s + (Number(p.price) || 0), 0);
  const recent = rows.slice(0, 5);

  return (
    <div>
      {error ? <div className="error" style={{marginBottom: 16}}>{error}</div> : null}

      {/* stat cards */}
      <div className="cards">
        {loading
          ? Array.from({length: 4}).map((_, i) => <div key={i} className="card skeleton-card" />)
          : STAT_META.map(m => (
              <div key={m.key} className="card">
                <div className="label">{m.label}</div>
                <div className="value" style={{color: m.color}}>{counts[m.key]}</div>
              </div>
            ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18}}>
        {/* by type */}
        <div className="card" style={{padding: '22px 24px'}}>
          <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>Listings by Type</div>
          <div style={{fontSize: 12.5, color: '#a0a3b1', marginTop: 2}}>Distribution of your portfolio</div>
          {loading ? (
            <div className="skeleton-block" style={{height: 200, marginTop: 16}} />
          ) : byType.length ? (
            <BarChart
              height={210}
              margin={{top: 16, right: 8, bottom: 24, left: 28}}
              xAxis={[{scaleType: 'band', data: byType.map(d => d.label), colorMap: {type: 'ordinal', values: byType.map(d => d.label), colors: byType.map(d => d.color)}}]}
              series={[{data: byType.map(d => d.value)}]}
              borderRadius={6}
              hideLegend
              sx={chartSx}
            />
          ) : (
            <p style={{color: '#a0a3b1', fontSize: 13, paddingTop: 30}}>No listings yet.</p>
          )}
        </div>

        {/* portfolio value */}
        <div className="card" style={{padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a1816, #2d2828)', border: 'none'}}>
          <div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase'}}>Portfolio Value</div>
            <div style={{fontSize: 34, fontWeight: 800, color: '#fff', marginTop: 12, lineHeight: 1}}>{money(totalValue, 'USD')}</div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8}}>{counts.total} listing{counts.total === 1 ? '' : 's'} total</div>
          </div>
          <Link to="/agent/properties/new" className="btn" style={{marginTop: 20, justifyContent: 'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add New Property
          </Link>
        </div>
      </div>

      {/* recent */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f0f1f5'}}>
          <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>Recent Listings</div>
          <Link to="/agent/properties" style={{fontSize: 13, color: '#d98a3e', fontWeight: 600, textDecoration: 'none'}}>View all →</Link>
        </div>
        <table>
          <thead>
            <tr><th>Property</th><th>Location</th><th>Type</th><th>Price</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length: 4}).map((_, i) => (
                <tr key={i}><td colSpan={5}><div className="skeleton-block" style={{height: 22}} /></td></tr>
              ))
            ) : recent.length ? (
              recent.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: 11}}>
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt="" style={{width: 46, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e4eb', flexShrink: 0}} />
                      ) : (
                        <div style={{width: 46, height: 34, borderRadius: 6, background: '#f5f6fa', flexShrink: 0}} />
                      )}
                      <span style={{fontWeight: 600, fontSize: 13, color: '#11111b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, display: 'inline-block'}}>{p.title}</span>
                    </div>
                  </td>
                  <td style={{color: '#636274', fontSize: 13}}>{[p.locality, p.city].filter(Boolean).join(', ') || '—'}</td>
                  <td><span style={{background: `${TYPE_COLORS[p.type] || '#6366f1'}15`, color: TYPE_COLORS[p.type] || '#6366f1', borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize'}}>{p.type}</span></td>
                  <td style={{fontWeight: 600, color: '#11111b'}}>{money(p.price, p.currency)}</td>
                  <td><span className={`badge ${p.verificationStatus === 'verified' ? 'green' : p.verificationStatus === 'rejected' ? 'red' : 'gold'}`}>{p.verificationStatus}</span></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '32px 0', color: '#a0a3b1'}}>No listings yet. <Link to="/agent/properties/new" style={{color: '#d98a3e'}}>Add your first property →</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
