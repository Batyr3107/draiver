/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Небесная цветовая палитра
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        primary: {
          50: '#e6f7ff',
          100: '#bae7ff',
          200: '#91d5ff',
          300: '#69c0ff',
          400: '#40a9ff',
          500: '#1890ff',
          600: '#096dd9',
          700: '#0050b3',
          800: '#003a8c',
          900: '#002766',
        },
        cloud: {
          50: '#fafbff',
          100: '#f0f5ff',
          200: '#d6e4ff',
          300: '#adc6ff',
          400: '#85a5ff',
          500: '#597ef7',
          600: '#2f54eb',
          700: '#1d39c4',
          800: '#10239e',
          900: '#061178',
        },
      },
      backgroundImage: {
        'gradient-sky': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-heaven': 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        'gradient-ocean': 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
        'gradient-cloud': 'linear-gradient(to top, #a8edea 0%, #fed6e3 100%)',
        'gradient-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-celestial': 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
      },
      boxShadow: {
        'sky': '0 10px 40px -10px rgba(14, 165, 233, 0.4)',
        'cloud': '0 8px 32px -8px rgba(89, 126, 247, 0.3)',
        'premium': '0 20px 60px -15px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(64, 169, 255, 0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
