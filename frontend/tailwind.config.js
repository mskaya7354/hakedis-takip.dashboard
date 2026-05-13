/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        ipad: '1024px',
        desktop: '1280px',
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
