import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Line,
} from 'recharts'
import { ICN } from '@/lib/icons'
import { fmtTRY0, fmtTRYCompact, fmtPctNum } from '@/lib/formatters'
import Panel from '@/components/Panel'
import ProgressBar from '@/components/ProgressBar'
import WaterfallChart from '@/components/WaterfallChart'
import ChartTooltip from '@/components/ChartTooltip'
import EmptyState from '@/components/EmptyState'

export default function OverviewTab({ p, agg }) {
  const sozlesmeSteps = [
    { label: 'İlk Sözleşme Bedeli', value: p.ilkSozlesmeBedeli, kind: 'start' },
    ...(p.zeyilnamelerToplami !== 0
      ? [{ label: 'Zeyilname Toplamı', value: Math.abs(p.zeyilnamelerToplami), kind: p.zeyilnamelerToplami >= 0 ? 'plus' : 'minus' }]
      : []),
    { label: 'Güncel Sözleşme Bedeli', value: p.guncelSozlesmeBedeli, kind: 'end' },
  ]

  const periodData = agg.rows.map((r, i) => {
    const cum = agg.rows.slice(0, i + 1).reduce((s, x) => s + x.matrah, 0)
    return {
      donem: r.donem.replace(/^\d{4}-/, ''),
      Matrah: r.matrah,
      Tahsil: r.tahsilEdilen,
      'Kümülatif Matrah': cum,
    }
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tamamlanma çubuğu */}
      <Panel title="Sözleşme İlerleme" sub="Güncel sözleşme bedelinin hangi oranda gerçekleştiği" idx={1}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 sm:gap-6 items-center">
          <div>
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Tamamlanan / Hedef
                </div>
                <div className="mono text-[14px] tabular-nums font-semibold">
                  {fmtTRY0(agg.toplamMatrah)}
                  <span style={{ color: 'var(--text-muted)' }}> / </span>
                  {fmtTRY0(p.guncelSozlesmeBedeli)}
                </div>
              </div>
              <div className="text-right">
                <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Backlog (Kalan)
                </div>
                <div className="mono text-[14px] tabular-nums font-semibold">{fmtTRY0(agg.kalanSozlesme)}</div>
              </div>
            </div>
            <ProgressBar value={agg.tamamlanmaOrani * 100} max={100} height={16} />
          </div>
          <div className="text-center border p-4"
               style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
            <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tamamlanma</div>
            <div className="font-display text-[40px] font-extrabold mono-num tabular-nums leading-none my-1"
                 style={{ color: 'var(--accent)' }}>
              {fmtPctNum(agg.tamamlanmaOrani * 100, 2)}
            </div>
            <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {agg.rows.length} HAKEDIŞ
            </div>
          </div>
        </div>
      </Panel>

      {/* Sözleşme waterfall + Periodic chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Panel title="Sözleşme Bedeli Akışı" sub="İlk sözleşme → zeyilname → güncel" idx={2}>
          <WaterfallChart steps={sozlesmeSteps} />
        </Panel>

        <Panel title="Dönem Bazlı Hakediş" sub="Matrah & tahsilat — kümülatif çizgi ile" idx={3}>
          {agg.rows.length > 0 ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={periodData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="donem" stroke="var(--text-muted)" tickLine={false}
                         axisLine={{ stroke: 'var(--border)' }}
                         tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false}
                         tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
                         tickFormatter={v => fmtTRYCompact(v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(232,93,4,0.06)' }} />
                  <Legend iconType="square" iconSize={10}
                          wrapperStyle={{ fontSize: 11, paddingTop: 8, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  <Bar dataKey="Matrah" name="MATRAH" fill="#1E5A8C" />
                  <Bar dataKey="Tahsil" name="TAHSİL" fill="#137333" />
                  <Line type="monotone" dataKey="Kümülatif Matrah" name="KÜMÜLATİF"
                        stroke="#E85D04" strokeWidth={2.5} dot={{ fill: '#E85D04', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={ICN.inbox({ size: 20 })} title="Hakediş kaydı yok"
                        desc="Veri girildikçe dönemsel trend burada görüntülenecek." />
          )}
        </Panel>
      </div>
    </div>
  )
}
