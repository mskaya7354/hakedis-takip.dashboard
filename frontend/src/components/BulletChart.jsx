import { fmtPctNum } from '@/lib/formatters'

export default function BulletChart({ value, target, max, color = 'var(--accent)', label }) {
  const valPct = Math.max(0, Math.min(100, (value / max) * 100))
  const tgtPct = Math.max(0, Math.min(100, (target / max) * 100))
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-[11px] mono mb-1.5">
          <span className="uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {fmtPctNum((value / max) * 100, 1)}
          </span>
        </div>
      )}
      <div className="relative w-full h-5 border" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
        {/* graduated bands */}
        <div className="absolute inset-0 flex">
          <div style={{ width: '33%', background: 'rgba(180,35,24,0.05)' }} />
          <div style={{ width: '33%', background: 'rgba(244,194,13,0.06)' }} />
          <div style={{ width: '34%', background: 'rgba(19,115,51,0.05)' }} />
        </div>
        {/* actual value */}
        <div className="absolute left-0 top-1 bottom-1 bar-fill"
             style={{ width: `${valPct}%`, background: color }} />
        {/* target marker */}
        <div className="absolute top-0 bottom-0 w-[2px]"
             style={{ left: `${tgtPct}%`, background: 'var(--text-primary)' }} />
      </div>
    </div>
  )
}
