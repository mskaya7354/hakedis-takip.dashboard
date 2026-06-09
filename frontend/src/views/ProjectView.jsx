import { useState } from 'react'
import { ICN } from '@/lib/icons'
import { fmtTRYCompact, fmtPct, fmtPctNum } from '@/lib/formatters'
import Chip from '@/components/Chip'
import KPICard from '@/components/KPICard'
import StatusBadge from '@/components/StatusBadge'
import Tabs from '@/components/Tabs'
import OverviewTab from '@/views/tabs/OverviewTab'
import HakedisTab from '@/views/tabs/HakedisTab'
import ZeyilnameTab from '@/views/tabs/ZeyilnameTab'
import MaliTab from '@/views/tabs/MaliTab'
import MaliyetSgkTab from '@/views/tabs/MaliyetSgkTab'

export default function ProjectView({ p, agg, zeyilnameler, onBack }) {
  const [tab, setTab] = useState('overview')
  // Zeyilname projectName = Proje_Kodu veya Proje_Adi olabilir (backend zaten filtreli gönderir)
  const projZeyilnameler = (zeyilnameler || []).filter(
    z => z.projectName === p.name || z.projectName === p.kod
  )

  const tabs = [
    { id: 'overview',   label: 'Genel Bakış' },
    { id: 'hakedis',    label: 'Hakedişler', count: agg.rows.length },
    { id: 'zeyilname',  label: 'Zeyilnameler', count: projZeyilnameler.length },
    { id: 'mali',       label: 'Mali Analiz' },
    { id: 'maliyet',    label: 'Maliyet & SGK' },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb + back */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mono text-[11px] uppercase tracking-wider hover:text-[var(--text-primary)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {ICN.arrowLeft({ size: 14, stroke: 2 })}
          <span>Portföy</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
        </button>
        <StatusBadge durum={p.durum} />
      </div>

      {/* Project header */}
      <div className="border-l-4 pl-4 sm:pl-6" style={{ borderColor: 'var(--accent)' }}>
        <div className="mono text-[10px] tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span>{p.kod || '—'}</span>
          {p.paraBirimi && p.paraBirimi !== 'TRY' && (
            <span className="px-1.5 py-0.5 font-bold tracking-normal"
                  style={{ background: '#1E5A8C', color: 'white' }}>
              {p.paraBirimi} · kur {p.guncelKur?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <h1 className="font-display text-[28px] sm:text-[40px] font-extrabold tracking-tight leading-none">
          {p.name}
        </h1>
        <div className="text-[14px] mt-2" style={{ color: 'var(--text-secondary)' }}>
          {p.musteri || '—'}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip label="AVANS" value={fmtPct(p.avansOrani, 0)} />
          <Chip label="NAKİT TEMİNAT" value={fmtPct(p.nakitTeminatOrani, 0)} />
          <Chip label="KDV" value={fmtPct(p.kdvOrani, 0)} />
          <Chip label="TEVKİFAT" value={fmtPct(p.tevkifatOrani, 0)} />
          <Chip label="STOPAJ" value={fmtPct(p.stopajOrani, 0)} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard idx={0} label="Güncel Sözleşme"
          value={fmtTRYCompact(p.guncelSozlesmeBedeli)}
          sub={`İlk: ${fmtTRYCompact(p.ilkSozlesmeBedeli)}`}
          accent="#0E0E10" icon={ICN.building({ size: 14, stroke: 2 })} />
        <KPICard idx={1} label="Tamamlanma"
          value={fmtPctNum(agg.tamamlanmaOrani * 100)}
          sub={`${agg.rows.length} hakediş · Backlog ${fmtTRYCompact(agg.kalanSozlesme)}`}
          accent="#1E5A8C" icon={ICN.trending({ size: 14, stroke: 2 })} />
        <KPICard idx={2} label="Toplam Gerçekleşen"
          value={fmtTRYCompact(agg.toplamMatrah)}
          sub={`Fatura: ${fmtTRYCompact(agg.toplamFatura)}`}
          accent="#E85D04" icon={ICN.layers({ size: 14, stroke: 2 })} />
        <KPICard idx={3} label="Tahsil Edilen"
          value={fmtTRYCompact(agg.toplamTahsil)}
          sub={`Tahsilat oranı ${fmtPct(agg.tahsilatOrani)}`}
          accent="#137333" icon={ICN.coin({ size: 14, stroke: 2 })} />
        <KPICard idx={4} label="Açık Bakiye"
          value={fmtTRYCompact(agg.toplamBakiye)}
          sub={agg.toplamBakiye > 0 ? 'Tahsil edilmemiş alacak' : 'Bakiye sıfır'}
          accent={agg.toplamBakiye > 0 ? '#B42318' : '#137333'}
          icon={ICN.alert({ size: 14, stroke: 2 })} />
      </div>

      {/* TABS */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="fade-in" key={tab}>
        {tab === 'overview'  && <OverviewTab p={p} agg={agg} />}
        {tab === 'hakedis'   && <HakedisTab p={p} agg={agg} />}
        {tab === 'zeyilname' && <ZeyilnameTab p={p} zeyilnameler={projZeyilnameler} />}
        {tab === 'mali'      && <MaliTab p={p} agg={agg} />}
        {tab === 'maliyet'   && <MaliyetSgkTab p={p} agg={agg} />}
      </div>
    </div>
  )
}
