import { ICN } from '@/lib/icons'
import { fmtTRY0, fmtPctNum } from '@/lib/formatters'
import Panel from '@/components/Panel'
import WaterfallChart from '@/components/WaterfallChart'
import EmptyState from '@/components/EmptyState'

function MiniStat({ label, value, accent }) {
  return (
    <div className="border p-3" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
      <div className="mono text-[9px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mono text-[15px] sm:text-[17px] font-extrabold tabular-nums mt-0.5 break-all"
           style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}

function HakedisTable({ p, agg }) {
  const lines = [
    { key: 'ilerleme', label: 'Dönemsel İlerleme', type: 'pct',   val: r => r.matrah / p.guncelSozlesmeBedeli, plan: 1, planFmt: 'pct' },
    { key: 'matrah',   label: 'Matrah',            type: 'money', val: r => r.matrah,           plan: p.guncelSozlesmeBedeli, emph: 'blue' },
    { key: 'kdv',      label: 'KDV',               type: 'money', val: r => r.kdv,              plan: p.guncelSozlesmeBedeli * p.kdvOrani, muted: true },
    { key: 'tev',      label: 'Tevkifat',          type: 'money', val: r => r.tevkifat,         plan: p.guncelSozlesmeBedeli * p.kdvOrani * p.tevkifatOrani, muted: true, neg: true },
    { key: 'stp',      label: 'Stopaj',            type: 'money', val: r => r.stopaj,           plan: p.guncelSozlesmeBedeli * p.stopajOrani, muted: true, neg: true },
    { key: 'fatura',   label: 'Fatura Toplamı',    type: 'money', val: r => r.faturaToplami,    plan: null, sub: true },
    { key: 'avans',    label: 'Avans Kesintisi',   type: 'money', val: r => r.avansKesinti,     plan: p.guncelSozlesmeBedeli * p.avansOrani, muted: true, neg: true },
    { key: 'nakit',    label: 'Nakit Teminat',     type: 'money', val: r => r.nakitTeminat,     plan: p.guncelSozlesmeBedeli * p.nakitTeminatOrani, muted: true, neg: true },
    { key: 'diger',    label: 'Diğer Kesintiler',  type: 'money', val: r => r.digerKesintiler,  plan: null, muted: true, neg: true },
    { key: 'odenecek', label: 'Ödenecek Tutar',    type: 'money', val: r => r.odenecek,         plan: null, emph: 'orange' },
    { key: 'tahsil',   label: 'Tahsil Edilen',     type: 'money', val: r => r.tahsilEdilen,     plan: null, emph: 'green' },
    { key: 'bakiye',   label: 'Bakiye',            type: 'money', val: r => r.bakiye,           plan: null, emph: 'red' },
  ]

  const emphFG = k => k === 'orange' ? '#E85D04' : k === 'red' ? '#B42318' : k === 'green' ? '#137333' : k === 'blue' ? '#1E5A8C' : 'var(--text-primary)'
  const emphBG = k => k === 'orange' ? '#FFF3E5' : k === 'red' ? '#FEE2E2' : k === 'green' ? '#E8F3EC' : k === 'blue' ? '#DBEAFE' : 'transparent'

  const formatVal = (line, v) => {
    if (v === null || v === undefined) return '—'
    if (line.type === 'pct') return fmtPctNum(v * 100, 2)
    return fmtTRY0(v)
  }

  const totalForLine = line =>
    line.key === 'ilerleme' ? agg.tamamlanmaOrani : agg.rows.reduce((s, r) => s + (line.val(r) || 0), 0)

  return (
    <div className="overflow-x-auto nice-scroll">
      <table className="w-full text-[12px] sm:text-[13px] border-collapse min-w-[680px]">
        <thead>
          <tr style={{ background: 'var(--bg-panel)' }}>
            <th className="text-left mono text-[10px] uppercase tracking-wider py-3 px-3 sm:px-4 border-b sticky left-0 z-10"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
              KALEM
            </th>
            <th className="text-right mono text-[10px] uppercase tracking-wider py-3 px-3 sm:px-4 border-b min-w-[110px]"
                style={{ color: 'var(--accent)', borderColor: 'var(--border)' }}>
              PLANLANAN
            </th>
            {agg.rows.map(r => (
              <th key={r.id} className="text-right mono text-[10px] uppercase tracking-wider py-3 px-3 sm:px-4 border-b min-w-[110px]"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                <div>{r.hakedisNo}. HAKEDIŞ</div>
                <div className="normal-case font-normal" style={{ color: 'var(--text-muted)' }}>{r.donem}</div>
              </th>
            ))}
            <th className="text-right mono text-[10px] uppercase tracking-wider py-3 px-3 sm:px-4 border-b min-w-[110px]"
                style={{ background: '#FFF3E5', color: '#9A3500', borderColor: 'var(--border)' }}>
              TOPLAM
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            const total = totalForLine(line)
            const bg = line.emph ? emphBG(line.emph) : (i % 2 === 1 ? 'var(--bg-panel)' : 'white')
            return (
              <tr key={line.key} style={{ background: bg }}>
                <td className="text-left py-2.5 px-3 sm:px-4 border-b sticky left-0 z-10"
                    style={{
                      background: bg,
                      borderColor: 'var(--border)',
                      color: line.emph ? emphFG(line.emph) : line.muted ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontWeight: line.emph ? 700 : line.sub ? 600 : 400,
                    }}>
                  <span className="flex items-center gap-1.5">
                    {line.neg && <span style={{ color: 'var(--text-muted)' }}>−</span>}
                    {line.label}
                  </span>
                </td>
                <td className="text-right py-2.5 px-3 sm:px-4 border-b mono tabular-nums"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                  {line.plan === null ? '—' : line.planFmt === 'pct' ? '%100,00' : fmtTRY0(line.plan)}
                </td>
                {agg.rows.map(r => (
                  <td key={r.id} className="text-right py-2.5 px-3 sm:px-4 border-b mono tabular-nums"
                      style={{
                        color: line.emph ? emphFG(line.emph) : line.muted ? 'var(--text-secondary)' : 'var(--text-primary)',
                        fontWeight: line.emph ? 700 : 400,
                        borderColor: 'var(--border)',
                      }}>
                    {formatVal(line, line.val(r))}
                  </td>
                ))}
                <td className="text-right py-2.5 px-3 sm:px-4 border-b mono tabular-nums font-bold"
                    style={{ background: '#FFF3E5', color: line.emph ? emphFG(line.emph) : '#9A3500', borderColor: 'var(--border)' }}>
                  {formatVal(line, total)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function HakedisTab({ p, agg }) {
  if (agg.rows.length === 0) {
    return (
      <Panel padding="p-0">
        <EmptyState icon={ICN.inbox({ size: 20 })} title="Hakediş kaydı bulunmuyor"
                    desc="Veri_Girisi tabında bu projeye ait kayıt eklendiğinde burada görüntülenecek." />
      </Panel>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Panel title="Hakediş Detay Tablosu" sub={`${agg.rows.length} dönemsel hakediş — tüm kalemler`} idx={1} padding="p-0">
        <HakedisTable p={p} agg={agg} />
      </Panel>

      {/* Per-hakediş waterfall cards */}
      <div className="space-y-4 sm:space-y-6">
        {agg.rows.map((r, i) => (
          <Panel key={r.id} idx={i + 2}
            title={`${r.hakedisNo}. Hakediş — ${r.donem}`}
            sub={`Düzenleme: ${r.tarih}`}
            action={
              <span className="mono text-[10px] uppercase tracking-wider px-2 py-1 border"
                    style={{ borderColor: 'var(--border)' }}>
                {r.notlar || '—'}
              </span>
            }
          >
            <WaterfallChart steps={[
              { label: 'Matrah', value: r.matrah, kind: 'start' },
              { label: 'KDV', value: r.kdv, kind: 'plus' },
              { label: 'Tevkifat', value: r.tevkifat, kind: 'minus' },
              { label: 'Stopaj', value: r.stopaj, kind: 'minus' },
              { label: 'Avans Kesintisi', value: r.avansKesinti, kind: 'minus' },
              { label: 'Nakit Teminat', value: r.nakitTeminat, kind: 'minus' },
              { label: 'Diğer Kesintiler', value: r.digerKesintiler || 0, kind: 'minus' },
              { label: 'Ödenecek Tutar', value: r.odenecek, kind: 'end' },
            ]} />
            <div className="mt-4 pt-3 border-t border-dashed grid grid-cols-3 gap-3"
                 style={{ borderColor: 'var(--border)' }}>
              <MiniStat label="Ödenecek" value={fmtTRY0(r.odenecek)} accent="#E85D04" />
              <MiniStat label="Tahsil Edilen" value={fmtTRY0(r.tahsilEdilen)} accent="#137333" />
              <MiniStat label="Bakiye" value={fmtTRY0(r.bakiye)} accent={r.bakiye > 0 ? '#B42318' : '#137333'} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
