import { BRAND_HEX } from '../../theme/brandPalette'

export const chartTooltipStyle = {
  borderRadius: 12,
  border: 'none',
  background: '#1e1b3a',
  color: '#ece9ff',
}

export const chartGridStroke = 'rgba(255,255,255,0.08)'
export const chartAxisStroke = 'rgba(255,255,255,0.4)'

export const animatedLineProps = {
  isAnimationActive: true,
  animationDuration: 1500,
  animationEasing: 'ease-out',
}

export const animatedBarProps = {
  isAnimationActive: true,
  animationDuration: 1200,
  animationEasing: 'ease-out',
}

export const animatedAreaProps = {
  isAnimationActive: true,
  animationDuration: 1500,
  animationEasing: 'ease-out',
}

export const chartColors = {
  violet: BRAND_HEX.violet,
  blue: BRAND_HEX.blue,
  amber: BRAND_HEX.amber,
  emerald: '#22c55e',
}
