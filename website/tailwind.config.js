/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#211D1D',
        // amber is the primary accent (kept under the name `gold` so existing
        // utility classes like text-gold/bg-gold map straight onto it)
        gold: {DEFAULT: '#F2A65A', light: '#F6B978', dark: '#D98A3E'},
        sage: {DEFAULT: '#6F8F72', light: '#86A589', dark: '#5A7560'},
        cream: '#E8E2D8',
        danger: '#E0654F',
        // Theme-aware surfaces (RGB channels in CSS vars -> supports /opacity)
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        fg: 'rgb(var(--c-fg) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
      },
      boxShadow: {
        glow: '0 0 50px rgba(242,166,90,0.30)',
        soft: '0 30px 80px rgba(0,0,0,0.45)',
        card: '0 20px 50px rgba(0,0,0,0.35)',
      },
      keyframes: {
        marquee: {'0%': {transform: 'translateX(0)'}, '100%': {transform: 'translateX(-50%)'}},
        float: {'0%,100%': {transform: 'translateY(0)'}, '50%': {transform: 'translateY(-14px)'}},
        shimmer: {'100%': {transform: 'translateX(100%)'}},
        scrollDot: {'0%': {transform: 'translateY(0)', opacity: 1}, '70%': {opacity: 1}, '100%': {transform: 'translateY(18px)', opacity: 0}},
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        scrollDot: 'scrollDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
