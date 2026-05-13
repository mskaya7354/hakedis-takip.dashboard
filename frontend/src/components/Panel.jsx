function SectionHeader({ idx, title, sub, action }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b"
         style={{ borderColor: 'var(--border)' }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {idx !== undefined && (
            <span className="mono text-[10px] tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
              {String(idx).padStart(2, '0')}
            </span>
          )}
          <span className="mono text-[10px] tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
            // SECTION
          </span>
        </div>
        <h2 className="font-display text-[18px] sm:text-[22px] font-bold tracking-tight leading-none"
            style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {sub && <div className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export default function Panel({ children, className = '', title, sub, action, idx, padding = 'p-4 sm:p-5' }) {
  return (
    <div className={`relative bg-white border ${padding} ${className}`} style={{ borderColor: 'var(--border)' }}>
      {title && <SectionHeader idx={idx} title={title} sub={sub} action={action} />}
      {children}
    </div>
  )
}
