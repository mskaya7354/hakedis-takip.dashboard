import { ICN } from '@/lib/icons'
import { fmtTRY0, fmtTRYCompact, fmtPctNum } from '@/lib/formatters'
import Panel from '@/components/Panel'
import BulletChart from '@/components/BulletChart'
import DonutChart from '@/components/DonutChart'
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

function DonutLegend({ data, total }) {
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.name} className="flex items-center justify-between border-b border-dashed py-1.5"
             style={{ borderColor: 'var(--border)' }}>
          <span className="flex items-center gap-2 text-[12px]">
            <span className="w-3 h-3" style={{ background: d.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
          </span>
          <div className="text-right">
            <div className="mono text-[12px] font-bold tabular-nums">{fmtTRY0(d.value)}</div>
            <div className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {fmtPctNum((d.value / total) * 100, 1)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MaliTab({ p, agg }) {
  if (agg.rows.length === 0) {
    return (
      <Panel padding="p-0">
        <EmptyState icon={ICN.coin({ size: 20 })} title="Mali analiz için veri yok"
                    desc="İlk hakediş işlendiğinde dağılım ve oranlar burada görüntülenir." />
      </Panel>
    )
  }

  const dist = [
    { name: 'Tahsil Edilen', value: agg.toplamTahsil, color: '#137333' },
    { name: 'Bakiye (Açık)', value: agg.toplamBakiye, color: '#B42318' },
  ].filter(x => x.value > 0)
  const distTotal = dist.reduce((s, x) => s + x.value, 0)

  const kesintiler = [
    { name: 'Tevkifat', value: agg.toplamTevkifat, color: '#525866' },
    { name: 'Stopaj', value: agg.toplamStopaj, color: '#9A3500' },
    { name: 'Avans Kesintisi', value: agg.toplamAvansKesinti, color: '#1E5A8C' },
    { name: 'Nakit Teminat', value: agg.toplamNakitTeminat, color: '#0E0E10' },
    { name: 'Diğer', value: agg.toplamDiger, color: '#F4C20D' },
  ].filter(x => x.value > 0)
  const kesintiToplam = kesintiler.reduce((s, x) => s + x.value, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Avans hesabı: gerçek verilen avans (Excel) + mahsup + kalan */}
      <Panel title="Avans Hesabı"
             sub={agg.avans
               ? `Verilen avans: ${fmtTRY0(agg.avans.verilenAvans)} · Mahsup edilen: ${fmtTRY0(agg.avans.mahsupEdilen)}`
               : `Planlanan toplam avans kesintisi: ${fmtTRY0(agg.planlananAvansToplam)}`}
             idx={1}>
        {agg.avans && agg.avans.verilenAvans > 0 ? (
          <>
            <BulletChart value={agg.avans.mahsupEdilen} target={agg.avans.verilenAvans}
                         max={Math.max(agg.avans.verilenAvans, agg.avans.mahsupEdilen) * 1.1 || 1}
                         label="MAHSUP ORANI (verilen avansa göre)" />
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
              <MiniStat label="Verilen Avans" value={fmtTRY0(agg.avans.verilenAvans)} accent="var(--text-primary)" />
              <MiniStat label="Mahsup Edilen" value={fmtTRY0(agg.avans.mahsupEdilen)} accent="#E85D04" />
              <MiniStat label="Kalan Avans" value={fmtTRY0(agg.avans.kalanAvans)} accent={agg.avans.kalanAvans > 0 ? '#1E5A8C' : '#137333'} />
            </div>
          </>
        ) : p.avansOrani > 0 ? (
          <>
            <BulletChart value={agg.toplamAvansKesinti} target={agg.planlananAvansToplam}
                         max={Math.max(agg.planlananAvansToplam, agg.toplamAvansKesinti) * 1.1 || 1}
                         label="MAHSUP ORANI (planlanana göre)" />
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
              <MiniStat label="Planlanan Avans" value={fmtTRY0(agg.planlananAvansToplam)} accent="var(--text-primary)" />
              <MiniStat label="Mahsup Edilen" value={fmtTRY0(agg.toplamAvansKesinti)} accent="#E85D04" />
              <MiniStat label="Kalan" value={fmtTRY0(Math.max(0, agg.planlananAvansToplam - agg.toplamAvansKesinti))} accent="var(--text-secondary)" />
            </div>
          </>
        ) : (
          <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Bu proje için avans tanımlanmamış.
          </div>
        )}
      </Panel>

      {/* Two donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Panel title="Tahsilat Durumu" sub="Ödenecek tutar üzerinden dağılım" idx={2}>
          {distTotal > 0 ? (
            <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
              <div className="relative">
                <DonutChart data={dist} total={distTotal} size={200} thickness={28} />
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>TOPLAM</div>
                    <div className="mono text-[13px] font-extrabold tabular-nums">{fmtTRYCompact(distTotal)}</div>
                  </div>
                </div>
              </div>
              <DonutLegend data={dist} total={distTotal} />
            </div>
          ) : (
            <EmptyState compact icon={ICN.pie({ size: 20 })} title="Veri yok" />
          )}
        </Panel>

        <Panel title="Kesinti Dağılımı" sub="Matrah üzerinden yapılan kesintilerin oransal kırılımı" idx={3}>
          {kesintiToplam > 0 ? (
            <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
              <div className="relative">
                <DonutChart data={kesintiler} total={kesintiToplam} size={200} thickness={28} />
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>TOPLAM</div>
                    <div className="mono text-[13px] font-extrabold tabular-nums">{fmtTRYCompact(kesintiToplam)}</div>
                  </div>
                </div>
              </div>
              <DonutLegend data={kesintiler} total={kesintiToplam} />
            </div>
          ) : (
            <EmptyState compact icon={ICN.pie({ size: 20 })} title="Veri yok" />
          )}
        </Panel>
      </div>

      {/* Kümülatif waterfall */}
      <Panel title="Kümülatif Ödeme Anatomisi" sub="Tüm hakedişlerin matrahdan ödenecek tutara dönüşümü" idx={4}>
        <WaterfallChart steps={[
          { label: 'Toplam Matrah', value: agg.toplamMatrah, kind: 'start' },
          { label: 'KDV', value: agg.toplamKDV, kind: 'plus' },
          { label: 'Tevkifat', value: agg.toplamTevkifat, kind: 'minus' },
          { label: 'Stopaj', value: agg.toplamStopaj, kind: 'minus' },
          { label: 'Avans Kesintisi', value: agg.toplamAvansKesinti, kind: 'minus' },
          { label: 'Nakit Teminat', value: agg.toplamNakitTeminat, kind: 'minus' },
          { label: 'Diğer Kesintiler', value: agg.toplamDiger, kind: 'minus' },
          { label: 'Ödenecek Tutar', value: agg.toplamOdenecek, kind: 'end' },
        ]} />
      </Panel>
    </div>
  )
}
