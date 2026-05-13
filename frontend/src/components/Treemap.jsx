import { useEffect, useRef, useState } from 'react'
import { fmtTRYCompact } from '@/lib/formatters'

function squarifyLayout(items, rect) {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const totalVal = sorted.reduce((s, it) => s + it.value, 0)
  const totalArea = rect.w * rect.h
  const scale = totalVal > 0 ? totalArea / totalVal : 0

  const result = []
  let remaining = sorted
  let current = { ...rect }

  const worstRatio = (row, length) => {
    const sumValue = row.reduce((s, it) => s + it.value, 0)
    const sumArea = sumValue * scale
    const sideLength = sumArea / length
    let worst = 0
    for (const it of row) {
      const itemArea = it.value * scale
      const itemLen = itemArea / sideLength
      const aspect = Math.max(sideLength / itemLen, itemLen / sideLength)
      if (aspect > worst) worst = aspect
    }
    return worst
  }

  while (remaining.length > 0) {
    const isHorizontal = current.w >= current.h
    const length = isHorizontal ? current.h : current.w

    let row = [remaining[0]]
    let i = 1
    while (i < remaining.length) {
      const test = [...row, remaining[i]]
      if (worstRatio(test, length) <= worstRatio(row, length)) { row = test; i++ }
      else break
    }

    const sumValue = row.reduce((s, it) => s + it.value, 0)
    const sumArea = sumValue * scale
    const sideLength = sumArea / length
    let pos = 0
    for (const it of row) {
      const itemArea = it.value * scale
      const itemLen = itemArea / sideLength
      if (isHorizontal) result.push({ ...it, x: current.x, y: current.y + pos, w: sideLength, h: itemLen })
      else result.push({ ...it, x: current.x + pos, y: current.y, w: itemLen, h: sideLength })
      pos += itemLen
    }

    if (isHorizontal) current = { x: current.x + sideLength, y: current.y, w: current.w - sideLength, h: current.h }
    else current = { x: current.x, y: current.y + sideLength, w: current.w, h: current.h - sideLength }
    remaining = remaining.slice(row.length)
  }
  return result
}

function Treemap({ data, width, height }) {
  const totalVal = data.reduce((s, x) => s + (x.value || 0), 0)
  if (totalVal <= 0 || data.length === 0) return null
  const blocks = squarifyLayout(data.filter(d => d.value > 0), { x: 0, y: 0, w: width, h: height })

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {blocks.map((b, i) => {
        const showFull = b.w > 100 && b.h > 64
        const showMed = b.w > 64 && b.h > 36
        const showSmall = b.w > 30 && b.h > 18
        return (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h}
                  fill={b.color} stroke="white" strokeWidth="2" />
            {showFull && (
              <>
                <text x={b.x + 10} y={b.y + 22} fill="white" fontSize="12" fontWeight="700"
                      fontFamily="Archivo, sans-serif">{b.label}</text>
                <text x={b.x + 10} y={b.y + 42} fill="white" fontSize="16" fontWeight="800"
                      fontFamily="JetBrains Mono, monospace">{fmtTRYCompact(b.value)}</text>
                {b.sub && (
                  <text x={b.x + 10} y={b.y + 58} fill="white" fillOpacity="0.75" fontSize="10"
                        fontFamily="JetBrains Mono, monospace">{b.sub}</text>
                )}
              </>
            )}
            {!showFull && showMed && (
              <>
                <text x={b.x + 6} y={b.y + 14} fill="white" fontSize="10" fontWeight="700"
                      fontFamily="Archivo, sans-serif">{b.label}</text>
                <text x={b.x + 6} y={b.y + 28} fill="white" fillOpacity="0.85" fontSize="10"
                      fontFamily="JetBrains Mono, monospace">{fmtTRYCompact(b.value)}</text>
              </>
            )}
            {!showMed && showSmall && (
              <text x={b.x + 4} y={b.y + 12} fill="white" fontSize="9" fontWeight="700"
                    fontFamily="Archivo, sans-serif">{(b.label || '').slice(0, 3)}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function TreemapResponsive({ data, height = 280 }) {
  const ref = useRef(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(Math.max(200, Math.floor(e.contentRect.width)))
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ width: '100%', height }}>
      <Treemap data={data} width={w} height={height} />
    </div>
  )
}
