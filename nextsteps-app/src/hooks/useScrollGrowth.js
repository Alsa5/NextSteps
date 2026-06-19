import { useEffect, useState } from 'react'

/** Maps page scroll to 0–1 for scroll-driven 3D growth. */
export const useScrollGrowth = () => {
  const [growth, setGrowth] = useState(0.25)

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const maxScroll = Math.max(scrollHeight - clientHeight, 1)
      const progress = scrollTop / maxScroll
      setGrowth(0.2 + progress * 0.8)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return growth
}
