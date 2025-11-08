import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { memo } from 'react';

/**
 * Body text component with responsive sizing using CSS variables
 *
 * Uses the design system typography scale that automatically
 * adjusts across mobile, tablet, desktop, and TV.
 *
 * @param {'sm'|'base'|'lg'} size - Text size variant
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const bodyVariants = cva('leading-normal', {
  variants: {
    size: {
      sm: 'text-responsive-sm',     // Small body text
      base: 'text-responsive-base', // Default body text
      lg: 'text-responsive-lg',     // Large body text
    },
    weight: {
      light: 'font-light',
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    opacity: {
      primary: 'text-white/90',
      secondary: 'text-white/70',
      tertiary: 'text-white/50',
      disabled: 'text-white/30',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    clamp: {
      1: 'line-clamp-1',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
      false: '',
    },
  },
  defaultVariants: {
    size: 'base',
    weight: 'regular',
    opacity: 'primary',
    align: 'left',
    clamp: false,
  },
});

const Body = memo(function Body({
  size = 'base',
  weight = 'regular',
  opacity = 'primary',
  align = 'left',
  clamp = false,
  className,
  as: Component = 'p',
  children,
  ...props
}) {
  return (
    <Component
      className={clsx(bodyVariants({ size, weight, opacity, align, clamp }), className)}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Body;
