'use client';

import {useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';

interface Stats {
  users: number;
  agents: number;
  properties: number;
  reels: number;
  activeBoosts: number;
  boostRevenue: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Stats>('/admin/stats').then(setStats).catch(e => setError(e.message));
  }, []);

  const cards = stats
    ? [
        {label: 'Buyers', value: stats.users},
        {label: 'Agents', value: stats.agents},
        {label: 'Properties', value: stats.properties},
        {label: 'Reels', value: stats.reels},
        {label: 'Active boosts', value: stats.activeBoosts},
        {label: 'Boost revenue', value: `$${stats.boostRevenue.toFixed(2)}`},
      ]
    : [];

  return (
    <div>
      <h1>Overview</h1>
      {error ? <div className="error">{error}</div> : null}
      <div className="cards">
        {cards.map(c => (
          <div className="card" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
          </div>
        ))}
      </div>
      {!stats && !error ? <p style={{color: 'var(--muted)'}}>Loading…</p> : null}
    </div>
  );
}
