'use client';

/** Dependency-free SVG charts for the admin console. */

export function BarChart({ data, height = 160, format }: { data: { label: string; value: number }[]; height?: number; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      {/* The column wrapper carries h-full so the bar's percentage height has a resolved parent. */}
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div
            key={d.label}
            className="flex-1 h-full flex items-end min-w-0"
            title={`${d.label}: ${format ? format(d.value) : d.value}`}
          >
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 2, background: 'linear-gradient(180deg,#60a5fa,#8b5cf6)' }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[9px] text-gray-400 truncate">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ data, width = 120, height = 32, tone = '#3b82f6' }: { data: number[]; width?: number; height?: number; tone?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <polyline points={points.join(' ')} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Donut({ segments, size = 150, centerLabel, centerValue }: { segments: { label: string; value: number; color: string }[]; size?: number; centerLabel?: string; centerValue?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {centerValue && (
          <div className="mb-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{centerLabel}</div>
            <div className="text-[18px] font-bold text-gray-900 leading-tight">{centerValue}</div>
          </div>
        )}
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-semibold text-gray-900 ml-auto pl-3">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
