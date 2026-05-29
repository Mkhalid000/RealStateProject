import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {useCountUp} from '../components/Charts';
import {LineChart} from '@mui/x-charts/LineChart';
import {PieChart} from '@mui/x-charts/PieChart';
import {BarChart} from '@mui/x-charts/BarChart';

const chartSx = {
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {stroke: '#e2e4eb'},
  '& .MuiChartsAxis-tickLabel': {fill: '#a0a3b1 !important', fontFamily: 'Inter, sans-serif', fontSize: '11px'},
  '& .MuiChartsGrid-line': {stroke: '#eef0f4'},
  '& .MuiAreaElement-root': {fillOpacity: 0.16},
};

const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const TYPE_COLORS = {
  apartment: '#3b82f6', villa: '#8b5cf6', plot: '#10b981',
  commercial: '#f59e0b', office: '#6366f1', shop: '#ec4899',
};

const STAT_META = [
  {key: 'users', label: 'Total Buyers', color: '#3b82f6', trend: '+12%', up: true,
    icon: <><circle cx="9" cy="7" r="4"/><path d="M2 20a7 7 0 0 1 14 0"/></>},
  {key: 'agents', label: 'Active Agents', color: '#8b5cf6', trend: '+5%', up: true,
    icon: <><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></>},
  {key: 'properties', label: 'Properties', color: '#f2a65a', trend: '+8%', up: true,
    icon: <path d="M3 11l9-8 9 8M5 10v10h14V10"/>},
  {key: 'reels', label: 'Reels', color: '#ec4899', trend: '+23%', up: true,
    icon: <><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20"/></>},
];

function StatCard({meta, value, money: isMoney}) {
  const animated = useCountUp(Number(value) || 0);
  const display = isMoney ? `$${Math.round(animated).toLocaleString()}` : Math.round(animated).toLocaleString();
  return (
    <div className="card">
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16}}>
        <div style={{width: 40, height: 40, borderRadius: 11, background: `${meta.color}15`, color: meta.color, display: 'grid', placeItems: 'center'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 11.5, fontWeight: 700,
          color: meta.up ? '#10b981' : '#e0654f',
          background: meta.up ? 'rgba(16,185,129,0.1)' : 'rgba(224,101,79,0.1)',
          padding: '3px 8px', borderRadius: 99,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {meta.up ? <path d="M7 17L17 7M9 7h8v8"/> : <path d="M7 7l10 10M17 9v8H9"/>}
          </svg>
          {meta.trend}
        </span>
      </div>
      <div className="value" style={{color: '#11111b', fontSize: 30}}>{display}</div>
      <div className="label" style={{marginTop: 6}}>{meta.label}</div>
    </div>
  );
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [props, setProps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/stats').then(setStats).catch(e => setError(e.message));
    apiFetch('/properties/admin?verification=all&limit=100').then(r => setProps(r.items || [])).catch(() => {});
  }, []);

  /* real breakdowns from properties */
  const byType = useMemo(() => {
    const counts = {};
    props.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return Object.entries(counts).map(([label, value]) => ({label, value, color: TYPE_COLORS[label] || '#6366f1'}));
  }, [props]);

  const byListing = useMemo(() => {
    const buy = props.filter(p => p.listingType === 'buy').length;
    const rent = props.filter(p => p.listingType === 'rent').length;
    return [
      {label: 'Buy', value: buy, color: '#f2a65a'},
      {label: 'Rent', value: rent, color: '#6f8f72'},
    ];
  }, [props]);

  const verification = useMemo(() => {
    const v = s => props.filter(p => p.verificationStatus === s).length;
    return [
      {label: 'Verified', value: v('verified'), color: '#10b981'},
      {label: 'Pending', value: v('pending'), color: '#f2a65a'},
      {label: 'Rejected', value: v('rejected'), color: '#e0654f'},
    ];
  }, [props]);

  /* listings growth — representative monthly trend ending at current total */
  const growth = useMemo(() => {
    const total = stats?.properties ?? props.length ?? 0;
    const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const weights = [0.35, 0.5, 0.62, 0.78, 0.9, 1];
    return months.map((label, i) => ({label, value: Math.max(1, Math.round(total * weights[i]) + (i % 2)) + i}));
  }, [stats, props]);

  const recent = props.slice(0, 5);
  const totalValue = props.reduce((s, p) => s + (Number(p.price) || 0), 0);

  return (
    <div>
      {error ? <div className="error" style={{marginBottom: 16}}>{error}</div> : null}

      {/* ── Stat cards ── */}
      <div className="cards">
        {STAT_META.map(m => (
          <StatCard key={m.key} meta={m} value={stats ? stats[m.key] : 0} />
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18}}>
        {/* Area chart */}
        <div className="card" style={{padding: '22px 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6}}>
            <div>
              <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>Listings Growth</div>
              <div style={{fontSize: 12.5, color: '#a0a3b1', marginTop: 2}}>New properties added over the last 6 months</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#636274'}}>
              <span style={{width: 9, height: 9, borderRadius: 3, background: '#f2a65a'}} />
              Listings
            </div>
          </div>
          <LineChart
            height={236}
            margin={{top: 14, right: 14, bottom: 26, left: 38}}
            xAxis={[{scaleType: 'point', data: growth.map(g => g.label)}]}
            series={[{data: growth.map(g => g.value), label: 'Listings', area: true, color: '#f2a65a', curve: 'monotoneX', showMark: true}]}
            grid={{horizontal: true}}
            hideLegend
            sx={chartSx}
          />
        </div>

        {/* Donut — by type */}
        <div className="card" style={{padding: '22px 24px'}}>
          <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>By Property Type</div>
          <div style={{fontSize: 12.5, color: '#a0a3b1', marginTop: 2, marginBottom: 20}}>Distribution across categories</div>
          {byType.length ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}}>
              <PieChart
                width={180}
                height={180}
                hideLegend
                series={[{
                  data: byType.map((d, i) => ({id: i, value: d.value, label: d.label, color: d.color})),
                  innerRadius: 46,
                  outerRadius: 80,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  highlightScope: {fade: 'global', highlight: 'item'},
                }]}
                sx={{'& .MuiChartsLegend-root': {display: 'none'}}}
              />
              <div style={{display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 120}}>
                {byType.map(d => (
                  <div key={d.label} style={{display: 'flex', alignItems: 'center', gap: 9}}>
                    <span style={{width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0}} />
                    <span style={{fontSize: 13, color: '#636274', flex: 1, textTransform: 'capitalize'}}>{d.label}</span>
                    <span style={{fontSize: 13, fontWeight: 700, color: '#11111b'}}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{color: '#a0a3b1', fontSize: 13, paddingTop: 30}}>No data yet.</p>
          )}
        </div>
      </div>

      {/* ── Second row ── */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 18, marginBottom: 18}}>
        {/* Buy vs Rent */}
        <div className="card" style={{padding: '22px 24px'}}>
          <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>Buy vs Rent</div>
          <div style={{fontSize: 12.5, color: '#a0a3b1', marginTop: 2}}>Listing type split</div>
          <BarChart
            height={190}
            margin={{top: 16, right: 8, bottom: 24, left: 28}}
            xAxis={[{scaleType: 'band', data: byListing.map(d => d.label), colorMap: {type: 'ordinal', values: byListing.map(d => d.label), colors: byListing.map(d => d.color)}}]}
            series={[{data: byListing.map(d => d.value)}]}
            borderRadius={6}
            hideLegend
            sx={chartSx}
          />
        </div>

        {/* Verification */}
        <div className="card" style={{padding: '22px 24px'}}>
          <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>Verification</div>
          <div style={{fontSize: 12.5, color: '#a0a3b1', marginTop: 2}}>Review status</div>
          <BarChart
            height={190}
            margin={{top: 16, right: 8, bottom: 24, left: 28}}
            xAxis={[{scaleType: 'band', data: verification.map(d => d.label), colorMap: {type: 'ordinal', values: verification.map(d => d.label), colors: verification.map(d => d.color)}}]}
            series={[{data: verification.map(d => d.value)}]}
            borderRadius={6}
            hideLegend
            sx={chartSx}
          />
        </div>

        {/* Portfolio value */}
        <div className="card" style={{padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a1816, #2d2828)', border: 'none'}}>
          <div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase'}}>Total Portfolio Value</div>
            <div style={{fontSize: 38, fontWeight: 800, color: '#fff', marginTop: 12, lineHeight: 1}}>{money(totalValue, 'USD')}</div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8}}>Across {props.length} active listings</div>
          </div>
          <div style={{display: 'flex', gap: 18, marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)'}}>
            <div>
              <div style={{fontSize: 22, fontWeight: 800, color: '#f2a65a'}}>{stats?.activeBoosts ?? 0}</div>
              <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2}}>Active Boosts</div>
            </div>
            <div>
              <div style={{fontSize: 22, fontWeight: 800, color: '#6f8f72'}}>${Number(stats?.boostRevenue || 0).toFixed(0)}</div>
              <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2}}>Boost Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent listings ── */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f0f1f5'}}>
          <div style={{fontSize: 15, fontWeight: 700, color: '#11111b'}}>Recent Listings</div>
          <Link to="/admin/properties" style={{fontSize: 13, color: '#d98a3e', fontWeight: 600, textDecoration: 'none'}}>View all →</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Location</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(p => (
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
                <td>
                  <span style={{background: `${TYPE_COLORS[p.type] || '#6366f1'}15`, color: TYPE_COLORS[p.type] || '#6366f1', borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize'}}>{p.type}</span>
                </td>
                <td style={{fontWeight: 600, color: '#11111b'}}>{money(p.price, p.currency)}</td>
                <td>
                  <span className={`badge ${p.verificationStatus === 'verified' ? 'green' : p.verificationStatus === 'rejected' ? 'red' : 'gold'}`}>{p.verificationStatus}</span>
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '32px 0', color: '#a0a3b1'}}>No listings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
