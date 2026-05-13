import { useState } from 'react'
import { ICN } from '@/lib/icons'

function fmtDate(ts) {
  if (!ts) return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function Header({ view, activeProjectName, onHome, onLogout, isFetching, lastUpdatedAt }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2" style={{ borderColor: 'var(--text-primary)' }}>
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={onHome} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 grid place-items-center flex-shrink-0 relative"
               style={{ background: 'var(--text-primary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 18h20"/>
              <path d="M4 18a8 8 0 0 1 16 0"/>
              <path d="M10 10V6a2 2 0 0 1 4 0v4"/>
              <path d="M6 14h12"/>
            </svg>
            <div className="absolute -bottom-1 -right-1 w-3 h-3" style={{ background: 'var(--accent)' }} />
          </div>
          <div className="hidden sm:block text-left">
            <div className="font-display text-[15px] font-extrabold tracking-tight leading-none">
              HAKEDİŞ TAKİP
            </div>
            <div className="mono text-[9px] tracking-[0.15em] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Yönetim Paneli · v2.0
            </div>
          </div>
        </button>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-[11px] mono uppercase tracking-wider flex-1 ml-6 min-w-0"
             style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>PORTFÖY</span>
          {view === 'project' && (
            <>
              <span>/</span>
              <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {activeProjectName}
              </span>
            </>
          )}
          {isFetching && (
            <span className="ml-2 flex items-center gap-1 opacity-60">
              <span className="w-3 h-3 border border-t-transparent animate-spin inline-block"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[11px] mono px-3 py-1.5 border bg-white"
               style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{ICN.cal({ size: 13, stroke: 2 })}</span>
            <span style={{ color: 'var(--text-primary)' }}>{fmtDate(lastUpdatedAt)}</span>
          </div>
          <div className="w-8 h-8 grid place-items-center font-display font-extrabold text-[12px] text-white"
               style={{ background: 'var(--accent)' }}>
            MK
          </div>
          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider px-2 py-1.5 border hover:bg-gray-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title="Çıkış Yap"
          >
            {ICN.logout({ size: 13, stroke: 2 })}
            <span>Çıkış</span>
          </button>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden w-9 h-9 grid place-items-center border"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Menü"
          >
            {menuOpen ? ICN.close({ size: 16, stroke: 2 }) : ICN.menu({ size: 16, stroke: 2 })}
          </button>
        </div>
      </div>

      {/* Mobile expanded info bar */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-2 mono text-[11px]"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
          <div className="flex justify-between">
            <span className="uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tarih</span>
            <span style={{ color: 'var(--text-primary)' }}>{fmtDate(lastUpdatedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Görünüm</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {view === 'portfolio' ? 'Portföy' : activeProjectName}
            </span>
          </div>
          <button onClick={onLogout} className="w-full text-left flex items-center gap-2 pt-1 border-t"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {ICN.logout({ size: 13, stroke: 2 })}
            <span className="uppercase tracking-wider">Çıkış Yap</span>
          </button>
        </div>
      )}
    </header>
  )
}
