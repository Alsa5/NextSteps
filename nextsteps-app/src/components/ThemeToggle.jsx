import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '', compact = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const handleClick = () => toggleTheme()

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleTheme()
    }
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'theme-toggle--compact' : ''} ${className}`.trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={isDark ? 'Switch to bright theme' : 'Switch to dark theme'}
      title={isDark ? 'Bright theme' : 'Dark theme'}
    >
      {isDark ? <Sun size={compact ? 18 : 20} aria-hidden /> : <Moon size={compact ? 18 : 20} aria-hidden />}
      {!compact && <span>{isDark ? 'Bright' : 'Dark'}</span>}
    </button>
  )
}
