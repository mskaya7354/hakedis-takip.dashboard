export default function EmptyState({ icon, title, desc, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-12 px-6'} border border-dashed`}
         style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
      <div className="w-12 h-12 grid place-items-center mb-3 bg-white border"
           style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        {icon}
      </div>
      <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</div>
      {desc && (
        <div className="text-[12px] mt-1 max-w-md" style={{ color: 'var(--text-secondary)' }}>{desc}</div>
      )}
    </div>
  )
}
