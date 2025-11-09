/**
 * Design Tokens for Radio Constanța
 *
 * These tokens provide a single source of truth for design values
 * used across the application. They map to CSS variables defined in globals.css.
 */

export const colors = {
  // Pastel color palette - minimalist and modern
  // Primary brand colors (soft, calm tones)
  primary: '#6B9BD1',        // Soft blue - main brand color
  primaryDark: '#5A88BD',    // Darker blue for hover states
  secondary: '#F5A77B',      // Soft coral/peach
  secondaryDark: '#E39668',  // Darker coral for hover

  // Background colors (light, airy)
  bgPrimary: '#FAFBFC',      // Off-white main background
  bgSecondary: '#F5F7FA',    // Slightly darker for surfaces
  bgTertiary: '#EEF2F7',     // Card backgrounds

  // Text colors (high contrast on light backgrounds)
  textPrimary: '#1F2937',    // Near-black for main text
  textSecondary: '#6B7280',  // Medium gray for secondary text
  textTertiary: '#9CA3AF',   // Light gray for tertiary text

  // Accent colors (pastel, soft)
  accentPink: '#F4C4D0',     // Soft pink
  accentMint: '#B8E6D5',     // Soft mint
  accentLavender: '#D4C5F9', // Soft lavender
  accentPeach: '#FFD5C2',    // Soft peach

  // State colors (pastel versions)
  success: '#7BC67E',        // Soft green
  warning: '#F9C97C',        // Soft yellow
  error: '#F28B82',          // Soft red
  info: '#81C7E8',           // Soft blue

  // Borders and dividers
  border: '#E5E7EB',         // Subtle border
  borderDark: '#D1D5DB',     // Slightly darker border

  // Shadows (for layering)
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',

  // White
  white: '#FFFFFF',
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
  sm: '0.375rem',   // 6px - subtle rounding
  base: '0.5rem',   // 8px - standard rounding
  lg: '0.625rem',   // 10px - medium rounding
  xl: '0.75rem',    // 12px - larger rounding
  '2xl': '1rem',    // 16px - for special cases
  full: '9999px',   // for circular elements
};

export const shadows = {
  // Subtle shadows for depth (no blur layers, just soft elevation)
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  base: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px 0 rgba(0, 0, 0, 0.1)',
  lg: '0 8px 12px 0 rgba(0, 0, 0, 0.12)',
  xl: '0 12px 24px 0 rgba(0, 0, 0, 0.15)',

  // Focus ring (subtle, using primary color)
  focus: '0 0 0 3px rgba(107, 155, 209, 0.3)',
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
  // Micro-interaction timings (subtle and quick)
  duration: {
    fastest: '100ms',  // For immediate feedback
    fast: '150ms',     // Quick transitions
    base: '200ms',     // Standard micro-interactions
    slow: '300ms',     // Smooth transitions
    slower: '400ms',   // More pronounced animations
  },

  easing: {
    // Smooth, natural easing functions
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Subtle bounce
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
  opacity,
  touchTargets,
};
