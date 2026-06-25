import { useEffect, useRef, useState } from 'react'

/**
 * Hook for animating number changes with a smooth count-up transition
 * Useful for displaying score changes, rankings, and other metrics
 *
 * @param {number} value - The target value to animate to
 * @param {number} duration - Duration of animation in ms (default: 600)
 * @param {function} formatter - Optional formatter function for the display value
 * @returns {string} - The current animated value as a string
 *
 * @example
 * const displayScore = useCountUp(trainer.scorePercentage, 600, (val) => Math.round(val))
 */
export function useCountUp(value, duration = 600, formatter = Math.round) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const animationFrameRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (prevValueRef.current === value) {
      return // No change, don't animate
    }

    const start = prevValueRef.current
    const end = value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * easeProgress

      setDisplayValue(formatter(current))

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = value
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration, formatter])

  return String(displayValue)
}
