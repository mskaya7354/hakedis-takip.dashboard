export default function ProgressBar({ value, max = 100, color = 'var(--accent)', height = 10, showLabels = true }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full">
      <div className="relative w-full bg-white border overflow-hidden"
           style={{ height, borderColor: 'var(--text-primary)' }}>
        <div className="absolute inset-y-0 left-0 bar-fill" style={{ width: `${pct}%`, background: color }}>
          <div className="absolute inset-0 opacity-30"
               style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 4px, transparent 4px 8px)' }} />
        </div>
        {/* tick marks every 10% */}
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="absolute top-0 bottom-0 border-l opacity-50"
               style={{ left: `${10 * (i + 1)}%`, borderColor: 'var(--border)' }} />
        ))}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      )}
    </div>
  )
}
