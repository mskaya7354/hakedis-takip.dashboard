import { ICN } from '@/lib/icons'
import { fmtTRY0, fmtTRYCompact, fmtPctNum } from '@/lib/formatters'
import Panel from '@/components/Panel'
import DonutChart from '@/components/DonutChart'
import BulletChart from '@/components/BulletChart'
import EmptyState from '@/components/EmptyState'

const CAT_COLORS = ['#1E5A8C', '#E85D04', '#137333', '#9A3500', '#525866', '#F4C20D', '#0E0E10']

function MiniStat({ label, value, accent }) {
  return (
    <div className="border p-3" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
      <div className="mono text-[9px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mono text-[15px] sm:text-[17px] font-extrabold tabular-nums mt-0.5 break-all" style={{ color: accent }}>
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

export default function MaliyetSgkTab({ p, agg }) {
  const hasMaliyet = (agg.maliyetKategorileri || []).length > 0
  const sgk = agg.sgk

  if (!hasMaliyet && !sgk) {
    return (
      <Panel padding="p-0">
        <EmptyState icon={ICN.coin({ size: 20 })} title="Maliyet / SGK verisi yok"
                    desc="Excel'de Maliyetler ve SGK Bildirimleri tablolarına bu projeye kayıt eklendiğinde burada görüntülenir." />
      </Panel>
    )
  }

  const maliyetData = (agg.maliyetKategorileri || []).map((m, i) => ({
    name: m.kategori, value: m.tutar, color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Kârlılık özeti */}
      <Panel title="Kârlılık Özeti" sub="Gelir (gerçekleşen matrah) − fiili maliyet = brüt kâr" idx={1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="Gelir (Matrah)" value={fmtTRY0(agg.toplamMatrah)} accent="#1E5A8C" />
          <MiniStat label="Fiili Maliyet" value={fmtTRY0(agg.toplamMaliyet)} accent="#9A3500" />
          <MiniStat label="Brüt Kâr" value={fmtTRY0(agg.brutKar)} accent={agg.brutKar >= 0 ? '#137333' : '#B42318'} />
          <MiniStat label="Kâr Marjı" value={fmtPctNum(agg.karMarji * 100, 1)} accent="#E85D04" />
        </div>
      </Panel>

      {/* Maliyet dağılımı */}
      <Panel title="Maliyet Dağılımı" sub="Kategori bazlı fiili gider kırılımı" idx={2}>
        {hasMaliyet ? (
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 items-center">
            <div className="relative justify-self-center">
              <DonutChart data={maliyetData} total={agg.toplamMaliyet} size={200} thickness={28} />
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>TOPLAM</div>
                  <div className="mono text-[13px] font-extrabold tabular-nums">{fmtTRYCompact(agg.toplamMaliyet)}</div>
                </div>
              </div>
            </div>
            <DonutLegend data={maliyetData} total={agg.toplamMaliyet} />
          </div>
        ) : (
          <EmptyState compact icon={ICN.pie({ size: 20 })} title="Maliyet kaydı yok" />
        )}
      </Panel>

      {/* SGK asgari işçilik uyumu */}
      {sgk && (
        <Panel title="SGK Asgari İşçilik Uyumu"
               sub={`Gerekli min. işçilik = matrah × %${(p.asgariIscilikOrani * 100).toFixed(1)} asgari işçilik oranı`}
               idx={3}>
          {/* Risk banner */}
          <div className="flex items-center gap-3 p-3 mb-4 border-l-4"
               style={{
                 background: sgk.riskli ? '#FEE2E2' : '#E8F3EC',
                 borderColor: sgk.riskli ? '#B42318' : '#137333',
               }}>
            <span style={{ color: sgk.riskli ? '#B42318' : '#137333' }}>
              {ICN.alert({ size: 18, stroke: 2 })}
            </span>
            <div>
              <div className="font-bold text-[13px]" style={{ color: sgk.riskli ? '#B42318' : '#137333' }}>
                {sgk.riskli ? 'ASGARİ İŞÇİLİK EKSİK — MUVAZAA RİSKİ' : 'ASGARİ İŞÇİLİK UYGUN'}
              </div>
              <div className="mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Fark: {fmtTRY0(sgk.fark)} {sgk.riskli ? '(eksik bildirim)' : '(fazla bildirim)'}
              </div>
            </div>
          </div>

          <BulletChart value={sgk.gerceklesenPEK} target={sgk.gerekliMinIscilik}
                       max={Math.max(sgk.gerekliMinIscilik, sgk.gerceklesenPEK) * 1.15 || 1}
                       label="GERÇEKLEŞEN / GEREKLİ PEK" />

          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
            <MiniStat label="Gerekli Min. İşçilik" value={fmtTRY0(sgk.gerekliMinIscilik)} accent="var(--text-primary)" />
            <MiniStat label="Gerçekleşen PEK" value={fmtTRY0(sgk.gerceklesenPEK)} accent="#1E5A8C" />
            <MiniStat label="Açık / Fazla" value={fmtTRY0(sgk.fark)} accent={sgk.riskli ? '#B42318' : '#137333'} />
          </div>

          {/* Dönemler tablosu */}
          {sgk.donemler.length > 0 && (
            <div className="mt-4 overflow-x-auto nice-scroll">
              <table className="w-full text-[12px] border-collapse min-w-[420px]">
                <thead>
                  <tr style={{ background: 'var(--bg-panel)' }}>
                    {['DÖNEM', 'ÇALIŞAN', 'GÜN', 'PRİME ESAS (PEK)'].map((h, i) => (
                      <th key={h} className={`mono text-[10px] uppercase tracking-wider py-2.5 px-3 border-b ${i === 0 ? 'text-left' : 'text-right'}`}
                          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sgk.donemler.map((d, i) => (
                    <tr key={d.donem} style={{ background: i % 2 === 1 ? 'var(--bg-panel)' : 'white' }}>
                      <td className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)' }}>{d.donem}</td>
                      <td className="py-2 px-3 border-b text-right mono tabular-nums" style={{ borderColor: 'var(--border)' }}>{d.calisanSayisi}</td>
                      <td className="py-2 px-3 border-b text-right mono tabular-nums" style={{ borderColor: 'var(--border)' }}>{d.gun}</td>
                      <td className="py-2 px-3 border-b text-right mono tabular-nums font-semibold" style={{ borderColor: 'var(--border)' }}>{fmtTRY0(d.primeEsas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
