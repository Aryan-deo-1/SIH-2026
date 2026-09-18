/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          white: '#FFFFFF',
          'soft-orange': '#FFF4E8',
          'light-orange': '#FFE4C7',
          'primary-orange': '#F59E0B',
          'hover-orange': '#D97706',
          'dark-text': '#1F2937',
          'secondary-text': '#6B7280',
          'border': '#F1E5D7',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(245, 158, 11, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',
        'soft-hover': '0 8px 24px -4px rgba(245, 158, 11, 0.16), 0 6px 12px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
