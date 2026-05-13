function Sparkline({ values, color = '#E85D04', width = 64, height = 22 }) {
  if (!values || values.length < 2) {
    return <span className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>—</span>
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 4) + 2
    const y = height - 2 - ((v - min) / range) * (height - 4)
    return `${x},${y}`
  }).join(' ')
  const lastX = width - 2
  const lastY = height - 2 - ((values[values.length - 1] - min) / range) * (height - 4)
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6"
                strokeLinecap="square" strokeLinejoin="miter" />
      <rect x={lastX - 2} y={lastY - 2} width="4" height="4" fill={color} />
    </svg>
  )
}

export default function KPICard({ label, value, sub, accent, icon, idx, trend, delta }) {
  return (
    <div
      className="kpi-card relative bg-white border p-4 sm:p-5 flex flex-col gap-2 rise"
      style={{ borderColor: 'var(--border)', animationDelay: `${(idx || 0) * 60}ms` }}
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: 'var(--text-primary)' }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: 'var(--text-primary)' }} />

      <div className="flex items-start justify-between">
        <div className="mono text-[10px] tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
        {icon && (
          <div className="w-7 h-7 grid place-items-center flex-shrink-0"
               style={{ background: accent || 'var(--accent-soft)', color: 'white' }}>
            {icon}
          </div>
        )}
      </div>

      <div className="font-display text-[24px] sm:text-[28px] font-extrabold leading-none mono-num tracking-tight break-all"
           style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>

      <div className="flex items-end justify-between gap-2 mt-auto pt-1 border-t border-dashed"
           style={{ borderColor: 'var(--border)' }}>
        <div className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {sub}
        </div>
        {trend && trend.length > 0 && (
          <Sparkline values={trend} color={accent || '#E85D04'} />
        )}
        {delta && (
          <div className="mono text-[11px] font-semibold whitespace-nowrap"
               style={{ color: delta.val >= 0 ? '#137333' : '#B42318' }}>
            {delta.val >= 0 ? '▲' : '▼'} {Math.abs(delta.val).toFixed(2).replace('.', ',')}
            {delta.suffix || '%'}
          </div>
        )}
      </div>
    </div>
  )
}
