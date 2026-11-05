'use client';
import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';

/** Smooth area chart with hover tooltip. Pure SVG (no chart dependency). */
export function AreaChart({ data, height = 160, color = '#FF5A1F', format = (n: number) => String(n) }: { data: Array<{ label: string; value: number }>; height?: number; color?: string; format?: (n: number) => string }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, pad = 8;
  const { line, area, pts } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const step = (W - pad * 2) / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => [pad + i * step, height - pad - (d.value / max) * (height - pad * 2 - 14)] as const);
    let line = '';
    pts.forEach(([x, y], i) => {
      if (i === 0) { line = `M${x},${y}`; return; }
      const [px, py] = pts[i - 1]; const cx = (px + x) / 2;
      line += ` C${cx},${py} ${cx},${y} ${x},${y}`;
    });
    const area = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
    return { line, area, pts };
  }, [data, height]);
  if (!data.length) return null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full overflow-visible" role="img" aria-label="Chart" onMouseLeave={() => setHover(null)}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.28" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <motion.path d={area} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
        {pts.map(([x, y], i) => (
          <g key={i} onMouseEnter={() => setHover(i)}>
            <rect x={x - 20} y={0} width={40} height={height} fill="transparent" />
            {hover === i && <><line x1={x} x2={x} y1={y} y2={height} stroke={color} strokeOpacity="0.25" strokeDasharray="4 4" /><circle cx={x} cy={y} r="6" fill="#fff" stroke={color} strokeWidth="3" /></>}
          </g>
        ))}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute -top-2 rounded-xl bg-ink px-2.5 py-1 text-xs font-bold text-white" style={{ left: `${(pts[hover][0] / W) * 100}%`, transform: 'translateX(-50%)' }}>
          {format(data[hover].value)} · {data[hover].label}
        </div>
      )}
      <div className="mt-2 flex justify-between px-1 text-[11px] font-medium text-muted">{data.map((d, i) => <span key={i}>{d.label}</span>)}</div>
    </div>
  );
}

export function Ring({ value, max, size = 72, label }: { value: number; max: number; size?: number; label?: string }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r, p = Math.min(1, max ? value / max : 0);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ececef" strokeWidth="7" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringg)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - p) }} transition={{ duration: 1, ease: 'easeOut' }} />
        <defs><linearGradient id="ringg"><stop offset="0%" stopColor="#6c5ce7" /><stop offset="100%" stopColor="#c55cff" /></linearGradient></defs>
      </svg>
      <span className="absolute text-xs font-extrabold">{label ?? `${Math.round(p * 100)}%`}</span>
    </div>
  );
}
