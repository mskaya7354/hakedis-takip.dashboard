export default function LoginScreen({ onSubmit, error, loading }) {
  return (
    <div className="min-h-screen grid place-items-center p-6"
         style={{ background: 'var(--bg-page)' }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border-2 p-6 sm:p-8 space-y-5"
        style={{ borderColor: 'var(--text-primary)', boxShadow: '4px 4px 0 var(--text-primary)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 grid place-items-center relative flex-shrink-0"
               style={{ background: 'var(--text-primary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 18h20"/><path d="M4 18a8 8 0 0 1 16 0"/>
              <path d="M10 10V6a2 2 0 0 1 4 0v4"/><path d="M6 14h12"/>
            </svg>
            <div className="absolute -bottom-1 -right-1 w-3 h-3"
                 style={{ background: 'var(--accent)' }} />
          </div>
          <div>
            <div className="font-display text-[16px] font-extrabold tracking-tight leading-none">
              HAKEDİŞ TAKİP
            </div>
            <div className="mono text-[9px] tracking-[0.15em] uppercase mt-0.5"
                 style={{ color: 'var(--text-muted)' }}>
              Yönetim Paneli · v2.0
            </div>
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div className="mono text-[10px] tracking-[0.2em] uppercase mb-0.5"
               style={{ color: 'var(--text-muted)' }}>
            // GİRİŞ
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Panele erişmek için kimlik doğrulama gereklidir.
          </p>
        </div>

        <label className="block">
          <span className="mono text-[10px] uppercase tracking-wider block mb-1"
                style={{ color: 'var(--text-muted)' }}>
            Kullanıcı Adı
          </span>
          <input
            name="username"
            required
            autoComplete="username"
            className="w-full px-3 py-2.5 border font-mono text-base focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border-strong)',
              fontSize: '16px', /* iPad zoom önler */
              focusRingColor: 'var(--accent)',
            }}
          />
        </label>

        <label className="block">
          <span className="mono text-[10px] uppercase tracking-wider block mb-1"
                style={{ color: 'var(--text-muted)' }}>
            Şifre
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2.5 border font-mono text-base focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--border-strong)', fontSize: '16px' }}
          />
        </label>

        {error && (
          <div className="mono text-[11px] px-3 py-2 border"
               style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 font-display font-bold text-sm tracking-wider uppercase text-white
                     disabled:opacity-50 active:translate-y-px transition-transform"
          style={{ background: loading ? 'var(--text-secondary)' : 'var(--text-primary)' }}
        >
          {loading ? 'GİRİŞ YAPILIYOR…' : 'GİRİŞ YAP'}
        </button>
      </form>
    </div>
  )
}
