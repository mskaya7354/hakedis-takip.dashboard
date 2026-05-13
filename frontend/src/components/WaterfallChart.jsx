import { fmtTRY0 } from '@/lib/formatters'

export default function WaterfallChart({ steps, height = 36 }) {
  let cumulative = 0
  const enriched = steps.map((s) => {
    const start = s.kind === 'start' ? 0 : cumulative
    const end = s.kind === 'minus' ? cumulative - s.value : cumulative + s.value
    if (s.kind === 'start') cumulative = s.value
    else if (s.kind === 'minus') cumulative -= s.value
    else if (s.kind === 'plus') cumulative += s.value
    else if (s.kind === 'end') cumulative = s.value
    return { ...s, start, end }
  })
  const maxVal = Math.max(...enriched.map(s => Math.max(s.start, s.end)))
  const range = maxVal || 1

  return (
    <div className="w-full">
      {enriched.map((s, i) => {
        const left = (Math.min(s.start, s.end) / range) * 100
        const width = (Math.abs(s.end - s.start) / range) * 100
        const isStart = s.kind === 'start'
        const isEnd = s.kind === 'end'
        const isMinus = s.kind === 'minus'
        const color = isStart ? '#1E5A8C' : isEnd ? '#E85D04' : isMinus ? '#B42318' : '#137333'
        const bg = isStart ? '#DBEAFE' : isEnd ? '#FFEDD5' : isMinus ? '#FEE2E2' : '#D4EDDA'
        return (
          <div key={i}
               className="grid grid-cols-[1fr_60%_auto] gap-3 items-center py-1.5 border-b border-dashed last:border-0"
               style={{ borderColor: 'var(--border)' }}>
            <div className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isMinus && <span className="mono" style={{ color: '#B42318' }}>−</span>}
              {!isStart && !isEnd && !isMinus && <span className="mono" style={{ color: '#137333' }}>+</span>}
              <span style={isStart || isEnd ? { fontWeight: 600, color: 'var(--text-primary)' } : {}}>
                {s.label}
              </span>
            </div>
            <div className="relative border" style={{ height, background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
              <div className="absolute top-0 bottom-0 bar-fill"
                   style={{
                     left: `${left}%`,
                     width: `${Math.max(width, 0.4)}%`,
                     background: bg,
                     borderLeft: `2px solid ${color}`,
                     borderRight: isEnd ? `2px solid ${color}` : 'none',
                   }} />
              {!isStart && (
                <div className="absolute top-0 bottom-0 w-px"
                     style={{ left: `${(s.end / range) * 100}%`, background: color }} />
              )}
            </div>
            <div className="mono text-[12px] font-semibold tabular-nums text-right whitespace-nowrap"
                 style={{ color: isMinus ? '#B42318' : color, minWidth: 100 }}>
              {isMinus ? '−' : isStart || isEnd ? '' : '+'}
              {fmtTRY0(s.value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
