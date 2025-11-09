import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { memo } from 'react';

/**
 * Body text component following design system specifications
 *
 * Typography specs:
 * - Large: 20px, Medium: 18px, Normal: 16px, Small: 14px
 * - Line height: 1.4× font size for all body text
 * - Available in Regular/Bold
 *
 * @param {'small'|'normal'|'medium'|'large'} size - Text size variant
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const bodyVariants = cva('', {
  variants: {
    size: {
      small: 'text-[14px] leading-[19.6px]',   // Small - 14px, line-height: 1.4 × 14 = 19.6px
      normal: 'text-[16px] leading-[22.4px]',  // Normal - 16px, line-height: 1.4 × 16 = 22.4px
      medium: 'text-[18px] leading-[25.2px]',  // Medium - 18px, line-height: 1.4 × 18 = 25.2px
      large: 'text-[20px] leading-[28px]',     // Large - 20px, line-height: 1.4 × 20 = 28px
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
