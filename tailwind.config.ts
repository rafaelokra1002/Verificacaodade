import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        hacker: {
          bg: '#0a0e0a',
          card: '#0d120d',
          border: '#1a2e1a',
          glow: '#00ff41',
          text: '#00ff41',
          dim: '#0a6e20',
          muted: '#2d5a2d',
          surface: '#111611',
          input: '#0f160f',
        },
      },
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 3s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'scan': 'scan 8s linear infinite',
        'typing': 'typing 1s steps(20) forwards',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '25%': { opacity: '0.95' },
          '75%': { opacity: '0.9' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff41, 0 0 10px #00ff4130' },
          '50%': { boxShadow: '0 0 10px #00ff41, 0 0 20px #00ff4150, 0 0 30px #00ff4120' },
        },
        'matrix-rain': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px #00ff41, 0 0 10px #00ff4130',
        'neon-lg': '0 0 10px #00ff41, 0 0 20px #00ff4140, 0 0 40px #00ff4120',
        'neon-red': '0 0 5px #ff0040, 0 0 10px #ff004030',
        'neon-yellow': '0 0 5px #ffff00, 0 0 10px #ffff0030',
      },
    },
  },
  plugins: [],
};

export default config;
