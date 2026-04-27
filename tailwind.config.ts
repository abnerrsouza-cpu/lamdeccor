import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // LAM brand palette - blue dominant, clean
        navy: {
          50: '#F1F5FA',
          100: '#DCE7F2',
          200: '#B6CBE0',
          300: '#7A9DC4',
          400: '#4D78A8',
          500: '#2D5F97',
          600: '#1F4A7E',
          700: '#143C6B',
          800: '#0F2A4A',
          900: '#0A1F3D',
          950: '#06152C'
        },
        gold: {
          DEFAULT: '#C49F5B',
          soft: '#D5B779',
          deep: '#A8853F'
        },
        cream: '#FBFAF7',
        slate: {
          DEFAULT: '#555E6B',
          muted: '#8B95A3'
        },
        line: '#D6DEE8'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Montserrat', 'system-ui', 'sans-serif'],
        serif: ['var(--font-sans)', 'Montserrat', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15, 42, 74, 0.04), 0 1px 2px rgba(15, 42, 74, 0.06)',
        card: '0 1px 4px rgba(15, 42, 74, 0.05), 0 4px 12px rgba(15, 42, 74, 0.04)'
      }
    }
  },
  plugins: []
};

export default config;
