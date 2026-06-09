import { ICN } from '@/lib/icons'
import { fmtTRY0, fmtTRYCompact } from '@/lib/formatters'
import Panel from '@/components/Panel'
import EmptyState from '@/components/EmptyState'

const HESAP_RENK = {
  'Ana Cari': '#1E5A8C',
  'Sözleşme': '#9A3500',
  'Avans': '#E85D04',
}

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

export default function CariEkstreTab({ p, hareketler }) {
  const rows = hareketler || []

  if (rows.length === 0) {
    return (
      <Panel padding="p-0">
        <EmptyState icon={ICN.inbox({ size: 20 })} title="Cari hareket yok"
                    desc="Excel'de Hareketler tablosuna bu projeye kayıt eklendiğinde tüm hareketler (her tip, her kalem) yürüyen bakiyeyle burada listelenir." />
      </Panel>
    )
  }

  const toplamBorc = rows.reduce((s, h) => s + (h.borc || 0), 0)
  const toplamAlacak = rows.reduce((s, h) => s + (h.alacak || 0), 0)
  const sonBakiye = rows[rows.length - 1]?.bakiye || 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <Panel title="Cari Hesap Ekstresi"
             sub={`${rows.length} hareket — tüm tipler (Ana Cari · Sözleşme · Avans) yürüyen bakiyeyle`}
             idx={1} padding="p-0">
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-[12px] sm:text-[13px] border-collapse min-w-[720px]">
            <thead>
              <tr style={{ background: 'var(--bg-panel)' }}>
                {['TARİH', 'AÇIKLAMA', 'TİP', 'BORÇ', 'ALACAK', 'BAKİYE'].map((h, i) => (
                  <th key={h}
                      className={`mono text-[10px] uppercase tracking-wider py-3 px-3 sm:px-4 border-b ${i <= 2 ? 'text-left' : 'text-right'} ${i === 5 ? 'sticky right-0' : ''}`}
                      style={{
                        color: i === 5 ? '#9A3500' : 'var(--text-muted)',
                        borderColor: 'var(--border)',
                        background: i === 5 ? '#FFF3E5' : 'var(--bg-panel)',
                      }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? 'var(--bg-panel)' : 'white' }}>
                  <td className="py-2.5 px-3 sm:px-4 border-b mono whitespace-nowrap"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{h.tarih}</td>
                  <td className="py-2.5 px-3 sm:px-4 border-b" style={{ borderColor: 'var(--border)' }}>{h.aciklama}</td>
                  <td className="py-2.5 px-3 sm:px-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="mono text-[10px] uppercase tracking-wider px-1.5 py-0.5"
                          style={{ background: (HESAP_RENK[h.hesapTipi] || '#525866') + '1A', color: HESAP_RENK[h.hesapTipi] || '#525866' }}>
                      {h.hesapTipi}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 border-b text-right mono tabular-nums"
                      style={{ borderColor: 'var(--border)', color: h.borc ? '#1E5A8C' : 'var(--text-muted)' }}>
                    {h.borc ? fmtTRY0(h.borc) : '—'}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 border-b text-right mono tabular-nums"
                      style={{ borderColor: 'var(--border)', color: h.alacak ? '#137333' : 'var(--text-muted)' }}>
                    {h.alacak ? fmtTRY0(h.alacak) : '—'}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 border-b text-right mono tabular-nums font-bold sticky right-0"
                      style={{ borderColor: 'var(--border)', background: '#FFF3E5', color: h.bakiye >= 0 ? '#9A3500' : '#B42318' }}>
                    {fmtTRY0(h.bakiye)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--text-primary)' }}>
                <td colSpan={3} className="py-2.5 px-3 sm:px-4 mono text-[10px] uppercase tracking-wider text-white">TOPLAM</td>
                <td className="py-2.5 px-3 sm:px-4 text-right mono tabular-nums font-bold text-white">{fmtTRY0(toplamBorc)}</td>
                <td className="py-2.5 px-3 sm:px-4 text-right mono tabular-nums font-bold text-white">{fmtTRY0(toplamAlacak)}</td>
                <td className="py-2.5 px-3 sm:px-4 text-right mono tabular-nums font-extrabold text-white sticky right-0"
                    style={{ background: 'var(--accent)' }}>{fmtTRY0(sonBakiye)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Toplam Borç" value={fmtTRYCompact(toplamBorc)} accent="#1E5A8C" />
        <MiniStat label="Toplam Alacak" value={fmtTRYCompact(toplamAlacak)} accent="#137333" />
        <MiniStat label="Net Bakiye" value={fmtTRYCompact(sonBakiye)} accent={sonBakiye >= 0 ? '#9A3500' : '#B42318'} />
      </div>
    </div>
  )
}
