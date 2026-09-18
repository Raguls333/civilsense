/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#040711',
          900: '#070C18',
          850: '#0B1325',
          800: '#101B33',
          700: '#19284D',
          cyan: '#06B6D4',
          cyanGlow: 'rgba(6, 182, 212, 0.35)',
          amber: '#F59E0B',
          amberGlow: 'rgba(245, 158, 11, 0.35)',
          emerald: '#10B981',
          emeraldGlow: 'rgba(16, 185, 129, 0.35)',
          rose: '#F43F5E'
        },
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        site: {
          dark: '#070C18',
          card: '#0D172B',
          border: '#1E2D4A',
          steel: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'cyber-amber': '0 0 25px -3px rgba(245, 158, 11, 0.3), 0 0 10px -2px rgba(245, 158, 11, 0.2)',
        'cyber-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.3), 0 0 10px -2px rgba(6, 182, 212, 0.2)',
        'cyber-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.3), 0 0 10px -2px rgba(16, 185, 129, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'phone-frame': '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(6, 182, 212, 0.15)'
      },
      animation: {
        'radar-sweep': 'radarSweep 3s linear infinite',
        'laser-scan': 'laserScan 2.2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float-slow': 'floatSlow 4s ease-in-out infinite'
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        laserScan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0.2' },
          '50%': { transform: 'translateY(100%)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    },
  },
  plugins: [],
}
