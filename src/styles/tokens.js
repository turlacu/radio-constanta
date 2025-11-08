/**
 * Design Tokens for Radio Constanța
 *
 * These tokens provide a single source of truth for design values
 * used across the application. They map to CSS variables defined in globals.css.
 */

export const colors = {
  // Primary colors
  primary: '#00BFFF',
  secondary: '#9333EA',

  // Background colors
  darkBg: '#0C0C0C',
  darkSurface: '#1A1A1A',
  darkCard: '#1F1F1F',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
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

  // Glow effects
  glowPrimary: '0 0 20px rgba(0, 191, 255, 0.4)',
  glowSecondary: '0 0 20px rgba(147, 51, 234, 0.4)',
  glowFocus: '0 0 0 4px rgba(0, 191, 255, 0.6)',
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

  // Line heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },

  // Font sizes (these map to CSS variables)
  fontSize: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
    '4xl': 'var(--text-4xl)',
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
