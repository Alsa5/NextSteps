/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        space: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        space: {
          950: '#050510',
          900: '#0a0a1a',
          800: '#12122a',
          700: '#1a1a3e',
        },
        neon: {
          purple: '#a855f7',
          blue: '#3b82f6',
          gold: '#fbbf24',
          cyan: '#22d3ee',
        },
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glow: '0 0 30px rgba(168, 85, 247, 0.3)',
        'glow-gold': '0 0 40px rgba(251, 191, 36, 0.4)',
      },
    },
  },
  plugins: [],
}
