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
        // Dark mode pastel colors
        primary: '#7CA9DB',
        'primary-dark': '#6B9BD1',
        secondary: '#F5A77B',
        'secondary-dark': '#E39668',

        // Dark background colors
        'bg-primary': '#0F1419',
        'bg-secondary': '#1A1F2E',
        'bg-tertiary': '#242B3D',

        // Text colors (light on dark)
        'text-primary': 'rgba(255, 255, 255, 0.95)',
        'text-secondary': 'rgba(255, 255, 255, 0.7)',
        'text-tertiary': 'rgba(255, 255, 255, 0.5)',

        // Accent colors
        'accent-pink': '#F4C4D0',
        'accent-mint': '#B8E6D5',
        'accent-lavender': '#D4C5F9',
        'accent-peach': '#FFD5C2',

        // State colors
        success: '#7BC67E',
        warning: '#F9C97C',
        error: '#F28B82',
        info: '#81C7E8',

        // Borders (subtle on dark)
        border: 'rgba(255, 255, 255, 0.1)',
        'border-dark': 'rgba(255, 255, 255, 0.15)',

        white: '#FFFFFF',
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
        '4k': '3840px',       // 4K UHD (3840x2160)
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
        '4k': '3840px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        // Custom spacing scale from guidelines: 8, 16, 24, 32, 40, 56, 72, 80, 96, 120
        '8': '0.5rem',     // 8px
        '16': '1rem',      // 16px
        '24': '1.5rem',    // 24px
        '32': '2rem',      // 32px
        '40': '2.5rem',    // 40px
        '56': '3.5rem',    // 56px
        '72': '4.5rem',    // 72px
        '80': '5rem',      // 80px
        '96': '6rem',      // 96px
        '120': '7.5rem',   // 120px
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
          '0%': { boxShadow: '0 0 0 0 rgba(9, 44, 76, 0.7)' },
          '100%': { boxShadow: '0 0 0 8px rgba(9, 44, 76, 0)' },
        },
      },
    },
  },
  plugins: [],
}
