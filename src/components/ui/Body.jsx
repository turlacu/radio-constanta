import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { memo } from 'react';

/**
 * Body text component with web-optimized typography
 *
 * Typography specs (web-scaled for readability):
 * - Large: 18px, Medium: 16px, Normal: 14px, Small: 12px
 * - Line height: 1.5× font size for better readability
 * - Available in Regular/Bold
 *
 * @param {'small'|'normal'|'medium'|'large'} size - Text size variant
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const bodyVariants = cva('', {
  variants: {
    size: {
      small: 'text-[12px] leading-[18px]',    // Small - 12px, line-height: 1.5 × 12 = 18px
      normal: 'text-[14px] leading-[21px]',   // Normal - 14px, line-height: 1.5 × 14 = 21px
      medium: 'text-[16px] leading-[24px]',   // Medium - 16px, line-height: 1.5 × 16 = 24px
      large: 'text-[18px] leading-[27px]',    // Large - 18px, line-height: 1.5 × 18 = 27px
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
    size: 'normal',
    weight: 'regular',
    opacity: 'primary',
    align: 'left',
    clamp: false,
  },
});

const Body = memo(function Body({
  size = 'normal',
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
