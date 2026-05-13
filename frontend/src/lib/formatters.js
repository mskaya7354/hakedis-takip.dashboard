const TR_LOC = 'tr-TR'

export const fmtTRY0 = (val) =>
  new Intl.NumberFormat(TR_LOC, { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0)

export const fmtTRY2 = (val) =>
  new Intl.NumberFormat(TR_LOC, { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0)

export const fmtTRYCompact = (val) => {
  const v = val || 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000_000) return `${sign}₺${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} Mr`
  if (abs >= 1_000_000)     return `${sign}₺${(abs / 1_000_000).toFixed(2).replace('.', ',')} Mn`
  if (abs >= 1_000)         return `${sign}₺${(abs / 1_000).toFixed(0)}K`
  return `${sign}₺${abs}`
}

export const fmtNum = (val) =>
  new Intl.NumberFormat(TR_LOC, { maximumFractionDigits: 0 }).format(val || 0)

export const fmtPct = (ratio, digits = 2) =>
  `%${((ratio || 0) * 100).toFixed(digits).replace('.', ',')}`

export const fmtPctNum = (n, digits = 2) =>
  `%${(n || 0).toFixed(digits).replace('.', ',')}`

export const TR_MONTHS = {
  Ocak: 0, Şubat: 1, Subat: 1, Mart: 2, Nisan: 3,
  Mayıs: 4, Mayis: 4, Haziran: 5, Temmuz: 6,
  Ağustos: 7, Agustos: 7, Eylül: 8, Eylul: 8,
  Ekim: 9, Kasım: 10, Kasim: 10, Aralık: 11, Aralik: 11,
}

export const parseDonem = (donem) => {
  if (!donem) return new Date(2000, 0)
  const m = /^(\d{4})-([A-Za-zçÇğĞıİöÖşŞüÜ]+)$/.exec(donem)
  if (m) return new Date(parseInt(m[1]), TR_MONTHS[m[2]] ?? 0)
  return new Date(2000, 0)
}

export const parseDateTR = (s) => {
  if (!s) return null
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s)
  if (!m) return null
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
}
