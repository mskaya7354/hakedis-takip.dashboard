import { fmtTRY0 } from '@/lib/formatters'

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border p-2.5 text-[12px]"
         style={{ borderColor: 'var(--text-primary)', boxShadow: '2px 2px 0 var(--text-primary)' }}>
      <div className="mono text-[10px] uppercase tracking-wider mb-1.5 pb-1 border-b"
           style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="mono font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {fmtTRY0(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
