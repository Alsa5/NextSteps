import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import './GalaxySimBackground.css'

/**
 * Full-viewport [galaxy-sim](https://github.com/andrewdcampbell/galaxy-sim) embed
 * (WebGL N-body disk galaxy). Ambient audio is controlled by the parent page.
 */
const GalaxySimBackground = forwardRef(function GalaxySimBackground({ onReady }, ref) {
  const iframeRef = useRef(null)

  useImperativeHandle(ref, () => ({
    setAudioMuted(muted) {
      const iframe = iframeRef.current
      iframe?.contentWindow?.postMessage(
        { type: 'galaxy-audio', muted: Boolean(muted) },
        window.location.origin,
      )
    },
  }), [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return undefined

    const handleLoad = () => {
      iframe.contentWindow?.postMessage(
        { type: 'galaxy-audio', muted: true },
        window.location.origin,
      )
      onReady?.()
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [onReady])

  return (
    <iframe
      ref={iframeRef}
      title="Maverick Nebula galaxy simulation"
      src="/galaxy-sim/index.html?embed=1"
      className="galaxy-sim-background"
      aria-hidden="true"
      tabIndex={-1}
    />
  )
})

export default GalaxySimBackground
