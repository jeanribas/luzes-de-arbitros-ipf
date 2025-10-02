import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1C64F2',
        good: '#f8fafc',
        bad: '#ef4444',
        judgeRed: '#f87171',
        judgeBlue: '#60a5fa',
        judgeYellow: '#facc15'
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
