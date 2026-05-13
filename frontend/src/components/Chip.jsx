export default function Chip({ label, value, accent }) {
  return (
    <span className="inline-flex items-stretch text-[11px] mono border" style={{ borderColor: 'var(--border)' }}>
      <span className="px-2 py-0.5 uppercase tracking-wider"
            style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="px-2 py-0.5 font-semibold"
            style={{ color: accent || 'var(--text-primary)', background: 'white', borderLeft: '1px solid var(--border)' }}>
        {value}
      </span>
    </span>
  )
}
