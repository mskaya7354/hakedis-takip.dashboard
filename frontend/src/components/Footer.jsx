export default function Footer({ lastUpdatedAt, isFetching }) {
  const fmtDateTime = (ts) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <footer className="border-t mt-12 pt-6 pb-8" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-3 text-[11px] mono uppercase tracking-wider"
           style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-3">
          <span>HAKEDİŞ TAKİP · v2.0</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">YÖNETİM PANELİ</span>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="w-3 h-3 border border-t-transparent animate-spin inline-block"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          )}
          <span>Son güncelleme: {fmtDateTime(lastUpdatedAt)}</span>
        </div>
      </div>
    </footer>
  )
}
