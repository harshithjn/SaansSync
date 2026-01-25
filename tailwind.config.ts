import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Medical Blue Primary
        'medical-blue': {
          50: 'oklch(0.97 0.02 240)',
          100: 'oklch(0.95 0.03 240)',
          200: 'oklch(0.9 0.05 240)',
          300: 'oklch(0.8 0.08 240)',
          400: 'oklch(0.7 0.1 240)',
          500: 'oklch(0.6 0.12 240)',
          600: 'oklch(0.45 0.15 240)',
          700: 'oklch(0.35 0.12 240)',
          800: 'oklch(0.25 0.08 240)',
          900: 'oklch(0.15 0.05 240)',
        },
        // Healing Sage/Teal
        'medical-sage': {
          50: 'oklch(0.97 0.02 160)',
          100: 'oklch(0.95 0.03 160)',
          200: 'oklch(0.9 0.05 160)',
          300: 'oklch(0.8 0.08 160)',
          400: 'oklch(0.7 0.1 160)',
          500: 'oklch(0.6 0.12 160)',
          600: 'oklch(0.45 0.15 160)',
          700: 'oklch(0.35 0.12 160)',
          800: 'oklch(0.25 0.08 160)',
          900: 'oklch(0.15 0.05 160)',
        },
        // Status Colors
        'status-stable': {
          50: 'oklch(0.96 0.03 140)',
          100: 'oklch(0.92 0.05 140)',
          200: 'oklch(0.85 0.08 140)',
          500: 'oklch(0.65 0.15 140)',
          700: 'oklch(0.25 0.12 140)',
        },
        'status-warning': {
          50: 'oklch(0.97 0.03 80)',
          100: 'oklch(0.93 0.05 80)',
          200: 'oklch(0.88 0.08 80)',
          500: 'oklch(0.7 0.15 80)',
          700: 'oklch(0.3 0.12 80)',
        },
        'status-critical': {
          50: 'oklch(0.97 0.03 20)',
          100: 'oklch(0.93 0.05 20)',
          200: 'oklch(0.85 0.08 20)',
          500: 'oklch(0.65 0.15 20)',
          700: 'oklch(0.3 0.12 20)',
        },
      },
      borderRadius: {
        'medical': '12px',
        'medical-lg': '16px',
        'medical-xl': '20px',
        'medical-2xl': '24px',
      },
      boxShadow: {
        'medical': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'medical-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'medical-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'medical-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'glow-stable': '0 0 0 1px oklch(0.85 0.08 140 / 0.3), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'glow-warning': '0 0 0 1px oklch(0.88 0.08 80 / 0.3), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'glow-critical': '0 0 0 1px oklch(0.85 0.08 20 / 0.3), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        'micro-bounce': 'micro-bounce 0.2s ease-out',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 0 1px oklch(0.85 0.08 20 / 0.3), 0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 0 1px oklch(0.85 0.08 20 / 0.5), 0 8px 12px -2px rgb(0 0 0 / 0.15)' 
          },
        },
        'micro-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        'medical-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'medical-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'medical-base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'medical-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'medical-xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'medical-2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
        'medical-3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.025em' }],
        'vital-sm': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'vital-md': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'vital-lg': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'vital-xl': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};

export default config;