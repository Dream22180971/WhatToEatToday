/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
        accent: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#FF7E33',
        secondary: '#FFB347',
        'warm-bg': '#FDF8F3',
        espresso: '#4D3E3E',
      },
      borderRadius: {
        healing: '2.5rem',
      },
      boxShadow: {
        card: '0 10px 40px -10px rgba(77, 62, 62, 0.08)',
        orange: '0 12px 30px -4px rgba(255, 126, 51, 0.2)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}

