/** Tri-color brand system (blue · violet · amber) — single source for UI + WebGL hyperspeed */

export const BRAND_HEX = {
  blue: '#4361EE',
  violet: '#7B5CF5',
  amber: '#F7C948',
}

export const BRAND_INT = {
  blue: 0x4361ee,
  violet: 0x7b5cf5,
  amber: 0xf7c948,
}

/** Hyperspeed fog / neon lanes — same hues as first integration, constrained to triad */
export const hyperspeedEffectColors = (theme) => {
  const { blue, violet, amber } = BRAND_INT
  if (theme === 'dark') {
    return {
      roadColor: 0x080808,
      islandColor: 0x0c0a14,
      background: 0x000000,
      shoulderLines: 0xffffff,
      brokenLines: 0xe8e4ff,
      leftCars: [violet, blue, amber],
      rightCars: [blue, amber, violet],
      sticks: violet,
    }
  }
  return {
    roadColor: 0xdde4fc,
    islandColor: 0xe9e0ff,
    background: 0xfefdfb,
    shoulderLines: violet,
    brokenLines: blue,
    leftCars: [violet, blue, amber],
    rightCars: [blue, amber, violet],
    sticks: amber,
  }
}
