export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b -mx-4 sm:mx-0 px-4 sm:px-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex overflow-x-auto nice-scroll gap-1">
        {tabs.map((t, i) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`relative px-3 sm:px-4 py-3 text-[11px] sm:text-[12px] mono font-semibold tracking-wider uppercase whitespace-nowrap transition flex items-center gap-2`}
              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              <span className="text-[10px] opacity-70">{String(i + 1).padStart(2, '0')}</span>
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 mono"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--border)',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                      }}>
                  {t.count}
                </span>
              )}
              {isActive && (
                <span className="absolute left-2 right-2 bottom-[-1px] h-[3px]"
                      style={{ background: 'var(--accent)' }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
