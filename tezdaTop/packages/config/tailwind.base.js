/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#116B50',
          'green-hover': '#0B563F',
          'green-light': '#E7F3EB',
          'green-soft': '#E0EFE7',
          ink: '#172C28',
          muted: '#566A63',
          bg: '#F3F6F3',
          line: '#DCE5DF',
          amber: '#8A4B08',
          'amber-bg': '#FFF2DC',
          error: '#B42318',
          'error-bg': '#FEF0EE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
