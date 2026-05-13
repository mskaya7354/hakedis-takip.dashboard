import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { ICN } from '@/lib/icons'
import { fmtTRY0, fmtTRYCompact, fmtPct, fmtPctNum, fmtNum } from '@/lib/formatters'
import Chip from '@/components/Chip'
import KPICard from '@/components/KPICard'
import Panel from '@/components/Panel'
import ProgressBar from '@/components/ProgressBar'
import StatusBadge from '@/components/StatusBadge'
import TreemapResponsive from '@/components/Treemap'
import ChartTooltip from '@/components/ChartTooltip'

const TREEMAP_PALETTE = [
  '#0E0E10', '#E85D04', '#1E5A8C', '#137333', '#B42318',
  '#525866', '#9A3500', '#1F6FA5', '#0F5524', '#7A0F11',
]

function Stat({ label, value, accent, muted }) {
  return (
    <div className="min-w-0">
      <div className="mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mono text-[13px] font-bold tabular-nums truncate"
           style={{ color: accent || (muted ? 'var(--text-secondary)' : 'var(--text-primary)') }}>
        {value}
      </div>
    </div>
  )
}

function ProjectCard({ p, agg, idx, onClick }) {
  const pct = agg.tamamlanmaOrani * 100
  const tahsilatPct = agg.tahsilatOrani * 100
  return (
    <button
      onClick={onClick}
      className="proj-card group relative text-left bg-white border hover:border-[var(--text-primary)] transition p-4 sm:p-5 lift rise"
      style={{ borderColor: 'var(--border)', animationDelay: `${idx * 60}ms` }}
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: 'var(--text-primary)' }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: 'var(--text-primary)' }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2" style={{ borderColor: 'var(--text-primary)' }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2" style={{ borderColor: 'var(--text-primary)' }} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex-shrink-0 grid place-items-center font-display font-extrabold text-[16px] text-white"
               style={{ background: 'var(--text-primary)' }}>
            {p.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-display text-[16px] sm:text-[18px] font-bold tracking-tight truncate">
              {p.name}
            </div>
            <div className="mono text-[10px] uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
              {p.kod || '—'} · {p.musteri || '—'}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StatusBadge durum={p.durum} size="sm" />
          <span className="mono text-[10px] flex items-center gap-1 group-hover:text-[var(--accent)]"
                style={{ color: 'var(--text-muted)' }}>
            DETAY {ICN.arrowUpRight({ size: 12, stroke: 2 })}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Tamamlanma
          </span>
          <span className="font-display font-extrabold text-[22px] mono-num tabular-nums leading-none">
            {fmtPctNum(pct, 2)}
          </span>
        </div>
        <ProgressBar value={pct} max={100} color="var(--accent)" height={8} showLabels={false} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-3 border-t border-dashed"
           style={{ borderColor: 'var(--border)' }}>
        <Stat label="Sözleşme" value={fmtTRY0(p.guncelSozlesmeBedeli)} />
        <Stat label="Backlog" value={fmtTRY0(p.guncelSozlesmeBedeli - agg.toplamMatrah)} muted />
        <Stat label="Tahsilat" value={fmtTRY0(agg.toplamTahsil)} accent="#137333" />
        <Stat label="Bakiye" value={fmtTRY0(agg.toplamBakiye)} accent={agg.toplamBakiye > 0 ? '#B42318' : '#137333'} />
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed text-[10px] mono uppercase tracking-wider"
           style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <span>{agg.rows.length} hakediş</span>
        <span>Tahsilat: {fmtPctNum(tahsilatPct, 1)}</span>
      </div>
    </button>
  )
}

function ProjectCompareChart({ data }) {
  const n = data.length
  const horizontal = n > 5
  const height = horizontal ? Math.max(280, n * 56) : 320

  if (horizontal) {
    return (
      <div style={{ height }} className="overflow-y-auto nice-scroll">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                    barGap={2} barCategoryGap={12}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" stroke="var(--text-muted)" tickLine={false}
                   axisLine={{ stroke: 'var(--border)' }}
                   tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
                   tickFormatter={v => fmtTRYCompact(v)} />
            <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tickLine={false}
                   axisLine={{ stroke: 'var(--border)' }}
                   tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} width={90} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(232,93,4,0.06)' }} />
            <Legend iconType="square" iconSize={10}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            <Bar dataKey="Matrah" name="MATRAH" fill="#1E5A8C" />
            <Bar dataKey="Tahsil" name="TAHSİL" fill="#137333" />
            <Bar dataKey="Bakiye" name="BAKİYE" fill="#B42318" />
            <Bar dataKey="Backlog" name="BACKLOG" fill="#525866" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: n > 3 ? 24 : 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false}
                 axisLine={{ stroke: 'var(--border)' }}
                 tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                 angle={n > 3 ? -20 : 0} textAnchor={n > 3 ? 'end' : 'middle'}
                 height={n > 3 ? 50 : 30} interval={0} />
          <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false}
                 tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
                 tickFormatter={v => fmtTRYCompact(v)} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(232,93,4,0.06)' }} />
          <Legend iconType="square" iconSize={10}
                  wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
          <Bar dataKey="Matrah" name="MATRAH" fill="#1E5A8C" />
          <Bar dataKey="Tahsil" name="TAHSİL" fill="#137333" />
          <Bar dataKey="Bakiye" name="BAKİYE" fill="#B42318" />
          <Bar dataKey="Backlog" name="BACKLOG" fill="#525866" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function PortfolioView({ portfolio, onSelectProject }) {
  const {
    projAggs, toplamPortfoyDegeri, toplamIlkSozlesme, toplamZeyilname,
    toplamGerceklesen, toplamTahsilat, toplamBakiye, toplamBacklog,
    portfoyTamamlanma, portfoyTahsilatOrani, musteriler,
    aktifProjeSayisi, toplamProjeSayisi, toplamHakedisSayisi, toplamZeyilnameSayisi,
  } = portfolio

  const treemapData = projAggs.map(({ p, agg }, i) => ({
    label: p.name.toUpperCase(),
    value: p.guncelSozlesmeBedeli,
    color: TREEMAP_PALETTE[i % TREEMAP_PALETTE.length],
    sub: `${p.musteri || '—'} · ${fmtPct(agg.tamamlanmaOrani)}`,
  }))

  const compareData = projAggs.map(({ p, agg }) => ({
    name: p.name,
    Matrah: agg.toplamMatrah,
    Tahsil: agg.toplamTahsil,
    Bakiye: agg.toplamBakiye,
    Backlog: p.guncelSozlesmeBedeli - agg.toplamMatrah,
  }))

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page heading */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="mono text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
            // OVERVIEW
          </div>
          <h1 className="font-display text-[28px] sm:text-[36px] font-extrabold tracking-tight leading-none mt-1">
            Portföy Genel Bakış
          </h1>
          <div className="text-[13px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Tüm projeler kümülatif veriler
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Chip label="AKTİF PROJE" value={`${aktifProjeSayisi} / ${toplamProjeSayisi}`} />
          <Chip label="HAKEDIŞ" value={fmtNum(toplamHakedisSayisi)} />
          <Chip label="ZEYİLNAME" value={fmtNum(toplamZeyilnameSayisi)} />
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard idx={0} label="Portföy Sözleşme Değeri"
          value={fmtTRYCompact(toplamPortfoyDegeri)}
          sub={`İlk: ${fmtTRYCompact(toplamIlkSozlesme)} · Zeyilname: ${fmtTRYCompact(toplamZeyilname)}`}
          accent="#0E0E10" icon={ICN.building({ size: 14, stroke: 2 })} />
        <KPICard idx={1} label="Gerçekleşen Matrah"
          value={fmtTRYCompact(toplamGerceklesen)}
          sub={`Tamamlanma ${fmtPct(portfoyTamamlanma)} · Backlog ${fmtTRYCompact(toplamBacklog)}`}
          accent="#1E5A8C" icon={ICN.layers({ size: 14, stroke: 2 })} />
        <KPICard idx={2} label="Toplam Tahsilat"
          value={fmtTRYCompact(toplamTahsilat)}
          sub={`Tahsilat oranı: ${fmtPct(portfoyTahsilatOrani)}`}
          accent="#137333" icon={ICN.coin({ size: 14, stroke: 2 })} />
        <KPICard idx={3} label="Açık Bakiye"
          value={fmtTRYCompact(toplamBakiye)}
          sub={toplamBakiye > 0 ? 'Tahsil edilmemiş alacak' : 'Bakiye sıfır'}
          accent={toplamBakiye > 0 ? '#B42318' : '#137333'}
          icon={ICN.alert({ size: 14, stroke: 2 })} />
        <KPICard idx={4} label="Müşteri Sayısı"
          value={fmtNum(musteriler.length)}
          sub={`${musteriler[0]?.musteri || '—'} (en büyük)`}
          accent="#E85D04" icon={ICN.folder({ size: 14, stroke: 2 })} />
      </div>

      {/* TREEMAP + COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Panel title="Portföy Dağılımı" sub="Proje bazlı sözleşme değeri kompozisyonu" idx={1}>
          <TreemapResponsive data={treemapData} height={320} />
          <div className={`mt-4 grid gap-x-4 gap-y-1 text-[11px] ${treemapData.length > 6 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {treemapData.map((t, i) => (
              <div key={i} className="flex items-center justify-between border-b border-dashed py-1 last:border-0 min-w-0"
                   style={{ borderColor: 'var(--border)' }}>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 flex-shrink-0" style={{ background: t.color }} />
                  <span className="mono uppercase tracking-wider truncate" style={{ color: 'var(--text-secondary)' }}>{t.label}</span>
                </span>
                <span className="mono tabular-nums font-semibold whitespace-nowrap pl-2" style={{ color: 'var(--text-primary)' }}>
                  {fmtTRYCompact(t.value)}{' '}
                  <span style={{ color: 'var(--text-muted)' }}>
                    ({fmtPctNum((t.value / toplamPortfoyDegeri) * 100, 1)})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Projeler Karşılaştırma" sub="Matrah · Tahsilat · Bakiye · Backlog" idx={2}>
          <ProjectCompareChart data={compareData} />
        </Panel>
      </div>

      {/* MÜŞTERİ BREAKDOWN */}
      <Panel title="Müşteri Bazlı Sözleşme" sub="Toplam sözleşme değerinin müşteri kırılımı" idx={3}>
        <div className="space-y-2">
          {musteriler.map((m, i) => {
            const pct = (m.deger / toplamPortfoyDegeri) * 100
            return (
              <div key={m.musteri} className="grid grid-cols-[1fr_auto] sm:grid-cols-[200px_1fr_auto] gap-3 items-center">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {m.musteri}
                </div>
                <div className="hidden sm:block">
                  <div className="relative h-6 border" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
                    <div className="absolute inset-y-0 left-0 bar-fill flex items-center px-2"
                         style={{ width: `${pct}%`, background: i === 0 ? '#0E0E10' : '#525866' }}>
                      <span className="mono text-[10px] font-bold text-white">{fmtPctNum(pct, 1)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="mono text-[13px] font-bold tabular-nums">{fmtTRY0(m.deger)}</div>
                  <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {m.projeSayisi} PROJE
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* PROJECT CARDS */}
      <div>
        <div className="flex items-end justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="mono text-[10px] tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>04</span>
              <span className="mono text-[10px] tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                // PROJELER
              </span>
            </div>
            <h2 className="font-display text-[18px] sm:text-[22px] font-bold tracking-tight leading-none">
              Proje Detayları
            </h2>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              Detaylı görünüm için projeye tıklayın
            </div>
          </div>
          <div className="mono text-[11px] uppercase tracking-wider hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {toplamProjeSayisi} kayıt
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {projAggs.map(({ p, agg }, i) => (
            <ProjectCard key={p.id} p={p} agg={agg} idx={i} onClick={() => onSelectProject(p.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}
