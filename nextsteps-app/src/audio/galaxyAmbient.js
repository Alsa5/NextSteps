const LANDING_TRACK = '/audio/lnplusmusic-synthwave-80s-retro-background-music-400483.mp3'

/**
 * Landing-page background music — self-hosted synthwave track.
 * Starts only after a user gesture (click on the music toggle).
 */
export function createGalaxyAmbient() {
  /** @type {HTMLAudioElement | null} */
  let audio = null

  const ensureAudio = () => {
    if (audio) return audio

    audio = new Audio(LANDING_TRACK)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.38
    return audio
  }

  const start = async () => {
    const track = ensureAudio()
    if (!track.paused) return
    await track.play()
  }

  const stop = async () => {
    if (!audio) return
    audio.pause()
  }

  const isPlaying = () => Boolean(audio && !audio.paused && !audio.ended)

  const dispose = async () => {
    if (!audio) return
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    audio = null
  }

  return { start, stop, isPlaying, dispose }
}
