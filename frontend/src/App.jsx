import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isAuthed, login, logout } from '@/api/auth'
import { fetchPortfolio, fetchProject } from '@/api/portfolio'
import LoginScreen from '@/auth/LoginScreen'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PortfolioView from '@/views/PortfolioView'
import ProjectView from '@/views/ProjectView'

function LoadingView() {
  return (
    <div className="py-24 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent animate-spin"
           style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <div className="mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        YÜKLENİYOR…
      </div>
    </div>
  )
}

function ErrorView({ err, onRetry }) {
  const is503 = err?.response?.status === 503
  return (
    <div className="py-16 flex flex-col items-center gap-4 text-center">
      <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--danger)' }}>
        // {is503 ? 'VERİ KAYNAĞI ERİŞİLEMİYOR' : 'BAĞLANTI HATASI'}
      </div>
      <div className="font-display text-2xl font-extrabold">
        {is503 ? 'Excel dosyasına ulaşılamıyor' : 'Veri yüklenemedi'}
      </div>
      <div className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
        {err?.response?.data?.detail || err?.message || 'Bilinmeyen hata'}
      </div>
      <button
        onClick={onRetry}
        className="mono text-[11px] uppercase tracking-wider px-4 py-2 border-2 hover:bg-gray-50"
        style={{ borderColor: 'var(--text-primary)' }}
      >
        Tekrar Dene
      </button>
    </div>
  )
}

function StaleBanner({ dataUpdatedAt }) {
  const sec = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 1000) : 0
  return (
    <div className="mono text-[11px] uppercase tracking-wider px-3 py-2 border mb-4"
         style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
      ⚠ Bağlantı sorunu — veriler {sec}s önceki halinden gösteriliyor
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthed)
  const [view, setView] = useState('portfolio')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // All hooks must be called unconditionally — before any early returns
  // refetchInterval: Excel kaydedildiğinde ~30sn içinde dashboard otomatik güncellenir
  const portfolioQ = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    enabled: authed && view === 'portfolio',
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  })

  const projectQ = useQuery({
    queryKey: ['project', activeProjectId],
    queryFn: ({ signal }) => fetchProject(activeProjectId, { signal }),
    enabled: authed && !!activeProjectId,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  })

  const activeQ = view === 'portfolio' ? portfolioQ : projectQ

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    const handleSubmit = async (e) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      setLoginError(null)
      setLoginLoading(true)
      try {
        await login(fd.get('username'), fd.get('password'))
        setAuthed(true)
      } catch (err) {
        setLoginError(err.response?.data?.detail || 'Giriş başarısız')
      } finally {
        setLoginLoading(false)
      }
    }
    return (
      <LoginScreen onSubmit={handleSubmit} error={loginError} loading={loginLoading} />
    )
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const onSelectProject = (id) => {
    setActiveProjectId(id)
    setView('project')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const onBack = () => {
    setView('portfolio')
    setActiveProjectId(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const onLogout = () => { logout(); setAuthed(false) }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        view={view}
        activeProjectName={projectQ.data?.project?.name || ''}
        onHome={onBack}
        onLogout={onLogout}
        isFetching={activeQ.isFetching}
        lastUpdatedAt={activeQ.dataUpdatedAt}
      />

      <main
        className="flex-1 max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 fade-in"
        key={view}
      >
        {/* Portfolio view */}
        {view === 'portfolio' && (
          portfolioQ.isLoading ? <LoadingView /> :
          portfolioQ.isError && !portfolioQ.data ? <ErrorView err={portfolioQ.error} onRetry={portfolioQ.refetch} /> :
          <>
            {portfolioQ.isError && portfolioQ.data && <StaleBanner dataUpdatedAt={portfolioQ.dataUpdatedAt} />}
            <PortfolioView portfolio={portfolioQ.data} onSelectProject={onSelectProject} />
          </>
        )}

        {/* Project detail view */}
        {view === 'project' && (
          projectQ.isLoading ? <LoadingView /> :
          projectQ.isError && !projectQ.data ? <ErrorView err={projectQ.error} onRetry={projectQ.refetch} /> :
          projectQ.data && <>
            {projectQ.isError && <StaleBanner dataUpdatedAt={projectQ.dataUpdatedAt} />}
            <ProjectView
              p={projectQ.data.project}
              agg={projectQ.data.agg}
              zeyilnameler={projectQ.data.zeyilnameler}
              hareketler={projectQ.data.hareketler}
              onBack={onBack}
            />
          </>
        )}
      </main>

      <Footer lastUpdatedAt={activeQ.dataUpdatedAt} isFetching={activeQ.isFetching} />
    </div>
  )
}
