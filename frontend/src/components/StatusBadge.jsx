const STATUS_MAP = {
  Devam:      { bg: '#FFF3E5', fg: '#9A3500', brd: '#E85D04', dot: '#E85D04' },
  Tamamlandı: { bg: '#E8F3EC', fg: '#0F5524', brd: '#137333', dot: '#137333' },
  Askıda:     { bg: '#FEF7E0', fg: '#7A5900', brd: '#B98800', dot: '#F4C20D' },
}

export default function StatusBadge({ durum, size = 'md' }) {
  const s = STATUS_MAP[durum] || STATUS_MAP.Devam
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 mono font-semibold uppercase tracking-wider ${padding}`}
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.brd}` }}
    >
      <span className="inline-block w-1.5 h-1.5" style={{ background: s.dot }} />
      {durum}
    </span>
  )
}
