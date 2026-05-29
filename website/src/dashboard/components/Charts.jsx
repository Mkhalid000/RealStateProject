import {useEffect, useRef, useState} from 'react';

/* ──────────────────────────────────────────────────────────────
   Lightweight, dependency-free SVG charts for the admin dashboard.
   AreaChart · DonutChart · BarChart  + a useCountUp helper.
   ────────────────────────────────────────────────────────────── */

/* animated number count-up */
export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const end = Number(target) || 0;
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

/* ── Area / line chart with hover tooltip ── */
export function AreaChart({data = [], color = '#f2a65a', height = 230, prefix = '', suffix = ''}) {
  const [active, setActive] = useState(null);
  const W = 660;
  const H = height;
  const padX = 14;
  const padTop = 18;
  const padBottom = 30;
  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const x = i => padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = v => padTop + innerH - ((v - min) / span) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padTop + innerH} L ${x(0)} ${padTop + innerH} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const id = `grad-${color.replace('#', '')}`;

  return (
    <div style={{position: 'relative', width: '100%'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display: 'block', overflow: 'visible'}}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {gridLines.map(g => (
          <line key={g} x1={padX} x2={W - padX} y1={padTop + innerH * g} y2={padTop + innerH * g}
            stroke="#eef0f4" strokeWidth="1" strokeDasharray={g === 1 ? '0' : '4 5'} />
        ))}

        {/* area + line */}
        <path d={areaPath} fill={`url(#${id})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* x labels */}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#a0a3b1" fontFamily="Inter, sans-serif">
            {d.label}
          </text>
        ))}

        {/* hover marker */}
        {active != null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={padTop} y2={padTop + innerH} stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            <circle cx={x(active)} cy={y(data[active].value)} r="6" fill="#fff" stroke={color} strokeWidth="2.5" />
          </g>
        )}

        {/* hover columns */}
        {data.map((d, i) => (
          <rect key={i}
            x={x(i) - innerW / data.length / 2}
            y={0}
            width={innerW / data.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{cursor: 'pointer'}} />
        ))}
      </svg>

      {/* tooltip */}
      {active != null && (
        <div style={{
          position: 'absolute',
          left: `${(x(active) / W) * 100}%`,
          top: `${(y(data[active].value) / H) * 100}%`,
          transform: 'translate(-50%, -135%)',
          background: '#11111b',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          zIndex: 5,
        }}>
          <span style={{color: '#a0a3b1', fontWeight: 500, marginRight: 6}}>{data[active].label}</span>
          {prefix}{Math.round(data[active].value).toLocaleString()}{suffix}
        </div>
      )}
    </div>
  );
}

/* ── Donut chart ── */
export function DonutChart({data = [], size = 180}) {
  const [active, setActive] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap'}}>
      <div style={{position: 'relative', width: size, height: size, flexShrink: 0}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform: 'rotate(-90deg)'}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f1f5" strokeWidth="16" />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            const seg = (
              <circle key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={active === i ? 20 : 16}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                style={{transition: 'stroke-width .18s', cursor: 'pointer'}} />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none',
        }}>
          <div>
            <div style={{fontSize: 26, fontWeight: 800, color: '#11111b', lineHeight: 1}}>
              {active != null ? data[active].value : total}
            </div>
            <div style={{fontSize: 10.5, color: '#a0a3b1', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3}}>
              {active != null ? data[active].label : 'Total'}
            </div>
          </div>
        </div>
      </div>

      {/* legend */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 130}}>
        {data.map((d, i) => (
          <div key={i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', opacity: active == null || active === i ? 1 : 0.45, transition: 'opacity .15s'}}>
            <span style={{width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0}} />
            <span style={{fontSize: 13, color: '#636274', flex: 1, textTransform: 'capitalize'}}>{d.label}</span>
            <span style={{fontSize: 13, fontWeight: 700, color: '#11111b'}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vertical bar chart ── */
export function BarChart({data = [], height = 200}) {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, height, paddingTop: 24}}>
      {data.map((d, i) => (
        <div key={i}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative'}}>
          {active === i && (
            <div style={{
              position: 'absolute', top: -2, background: '#11111b', color: '#fff', padding: '3px 9px',
              borderRadius: 6, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', zIndex: 3,
            }}>
              {d.value}
            </div>
          )}
          <div style={{
            width: '100%',
            maxWidth: 46,
            height: `${(d.value / max) * 100}%`,
            minHeight: 4,
            background: active === i ? d.color : `${d.color}cc`,
            borderRadius: '7px 7px 0 0',
            transition: 'height .5s cubic-bezier(.22,1,.36,1), background .15s',
          }} />
          <span style={{fontSize: 11, color: '#a0a3b1', marginTop: 8, textAlign: 'center', textTransform: 'capitalize'}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
