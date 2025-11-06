/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#00BFFF',
        'dark-bg': '#0C0C0C',
        'dark-surface': '#1A1A1A',
        'dark-card': '#1F1F1F',
      },
      // Custom breakpoints for different device types
      screens: {
        'xs': '375px',        // Small mobile
        'sm': '640px',        // Large mobile
        'md': '768px',        // Tablet portrait
        'lg': '1024px',       // Tablet landscape / Desktop
        'xl': '1280px',       // Desktop
        '2xl': '1536px',      // Large desktop
        '3xl': '1920px',      // TV / Ultra-wide
        '4k': '2560px',       // 4K TV
        // Custom device-specific breakpoints
        'tablet': '768px',
        'desktop': '1024px',
        'tv': '1920px',
      },
      maxWidth: {
        'mobile': '480px',
        'tablet': '768px',
        'desktop': '1280px',
        'tv': '1920px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'focus-ring': 'focusRing 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        focusRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 191, 255, 0.7)' },
          '100%': { boxShadow: '0 0 0 8px rgba(0, 191, 255, 0)' },
        },
      },
    },
  },
  plugins: [],
}
