export default function DonutChart({ data, total, size = 200, thickness = 28 }) {
  const totalVal = total ?? data.reduce((s, x) => s + x.value, 0)
  if (totalVal <= 0) return null

  const radius = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none"
              stroke="var(--border)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / totalVal
        const len = frac * circ
        const dasharray = `${len} ${circ - len}`
        const dashoffset = -offset
        offset += len
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
                  stroke={d.color} strokeWidth={thickness}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
        )
      })}
    </svg>
  )
}
