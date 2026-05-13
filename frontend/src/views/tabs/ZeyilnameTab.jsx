import { ICN } from '@/lib/icons'
import { fmtTRY0 } from '@/lib/formatters'
import Panel from '@/components/Panel'
import WaterfallChart from '@/components/WaterfallChart'
import EmptyState from '@/components/EmptyState'

export default function ZeyilnameTab({ p, zeyilnameler }) {
  if (zeyilnameler.length === 0) {
    return (
      <Panel padding="p-0">
        <EmptyState icon={ICN.doc({ size: 20 })} title="Zeyilname kaydı yok"
                    desc="Sözleşme değişikliği olduğunda burada listelenecek." />
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <Panel title="Sözleşme Değişiklikleri" sub={`${zeyilnameler.length} kayıt — kronolojik`} idx={1}>
        <WaterfallChart steps={[
          { label: 'İlk Sözleşme', value: p.ilkSozlesmeBedeli, kind: 'start' },
          ...zeyilnameler.map(z => ({
            label: z.zeyilnameNo,
            value: Math.abs(z.tutar),
            kind: z.tutar >= 0 ? 'plus' : 'minus',
          })),
          { label: 'Güncel Sözleşme', value: p.guncelSozlesmeBedeli, kind: 'end' },
        ]} />
      </Panel>

      <Panel title="Detaylar" idx={2} padding="p-0">
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {zeyilnameler.map((z, i) => {
            const pos = z.tutar >= 0
            return (
              <div key={z.id} className="p-4 sm:p-5 flex items-start gap-4">
                <div className="w-10 flex-shrink-0 text-center">
                  <div className="mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>REV</div>
                  <div className="font-display font-extrabold text-[20px] leading-none mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="font-semibold text-[14px]">{z.zeyilnameNo}</div>
                    <div className="mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{z.tarih}</div>
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>{z.aciklama}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>TUTAR</div>
                  <div className="mono text-[16px] font-extrabold tabular-nums"
                       style={{ color: pos ? '#137333' : '#B42318' }}>
                    {pos ? '+' : '−'}{fmtTRY0(Math.abs(z.tutar))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
