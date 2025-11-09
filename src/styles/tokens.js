/**
 * Design Tokens for Radio Constanța
 *
 * These tokens provide a single source of truth for design values
 * used across the application. They map to CSS variables defined in globals.css.
 */

export const colors = {
  // Brand colors
  primary: '#092C4C',
  secondary: '#F2994A',

  // State colors
  success: '#27AE60',
  warning: '#E2B93B',
  error: '#EB5757',
  info: '#2F80ED',

  // Grayscale palette
  black1: '#000000',
  black2: '#1D1D1D',
  black3: '#282828',
  gray1: '#333333',
  gray2: '#4F4F4F',
  gray3: '#828282',
  gray4: '#BDBDBD',
  gray5: '#E0E0E0',
  white: '#FFFFFF',

  // Background colors (using grayscale)
  darkBg: '#000000',
  darkSurface: '#1D1D1D',
  darkCard: '#282828',
};

export const spacing = {
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
};

export const borderRadius = {
  sm: '0.25rem',    // 4px
  base: '0.5rem',   // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  base: '0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',

  // Glow effects (updated with new primary color)
  glowPrimary: '0 0 20px rgba(9, 44, 76, 0.4)',
  glowSecondary: '0 0 20px rgba(242, 153, 74, 0.4)',
  glowFocus: '0 0 0 4px rgba(9, 44, 76, 0.6)',
};

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  },

  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Font sizes - Web-optimized for readability
  fontSize: {
    // Headings (line height 1.2× font size)
    h1: '36px',      // H1
    h2: '28px',      // H2
    h3: '24px',      // H3
    h4: '20px',      // H4
    h5: '18px',      // H5
    h6: '16px',      // H6
    // Body text (line height 1.5× font size)
    large: '18px',   // Body Large
    medium: '16px',  // Body Medium
    normal: '14px',  // Body Normal
    small: '12px',   // Body Small
  },

  // Line heights (web-optimized)
  lineHeight: {
    heading: 1.2,   // Headings: 1.2× font size (better readability)
    body: 1.5,      // Body text: 1.5× font size (better readability)
  },
};

export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',    // Split-screen mode starts here
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px', // TV
  '4k': '2560px',
};

export const animation = {
  duration: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  easing: {
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const glassmorphism = {
  // Intensity levels for glassmorphic effects
  subtle: {
    background: 'rgba(255, 255, 255, 0.05)',
    blur: '5px',
    border: 'rgba(255, 255, 255, 0.05)',
  },
  base: {
    background: 'rgba(255, 255, 255, 0.10)',
    blur: '10px',
    border: 'rgba(255, 255, 255, 0.10)',
  },
  strong: {
    background: 'rgba(255, 255, 255, 0.15)',
    blur: '15px',
    border: 'rgba(255, 255, 255, 0.20)',
  },
  intense: {
    background: 'rgba(255, 255, 255, 0.20)',
    blur: '20px',
    border: 'rgba(255, 255, 255, 0.30)',
  },
};

export const opacity = {
  disabled: 0.3,
  tertiary: 0.5,
  secondary: 0.7,
  primary: 0.9,
};

export const touchTargets = {
  mobile: 44,    // px
  tablet: 48,    // px
  desktop: 32,   // px
  tv: 80,        // px
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  breakpoints,
  animation,
  glassmorphism,
  opacity,
  touchTargets,
};
