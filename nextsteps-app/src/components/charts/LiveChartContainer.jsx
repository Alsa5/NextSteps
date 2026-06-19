import { useEffect, useRef, useState } from 'react'
import { ResponsiveContainer } from 'recharts'

/**
 * Recharts needs a measurable parent width. Inside CSS grid + framer-motion cards
 * ResponsiveContainer often measures 0 and renders an empty dashed placeholder.
 */
export default function LiveChartContainer({ height = 250, children, className = '', ariaLabel = 'Metrics chart' }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const measure = () => {
      const next = Math.floor(el.getBoundingClientRect().width)
      if (next > 0) setWidth(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`chart-surface ${className}`.trim()}
      style={{ height, minHeight: height }}
      role="img"
      aria-label={ariaLabel}
    >
      {width > 0 ? (
        <ResponsiveContainer
          width="100%"
          height={height}
          minWidth={0}
          debounce={50}
          initialDimension={{ width, height }}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  )
}
