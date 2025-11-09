import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { memo } from 'react';

/**
 * Heading component with web-optimized typography
 *
 * Typography specs (web-scaled for readability):
 * - H1: 36px, H2: 28px, H3: 24px, H4: 20px, H5: 18px, H6: 16px
 * - Line height: 1.2× font size for better readability
 * - Font weight: Bold
 *
 * @param {1|2|3|4|5|6} level - Heading level (1-6)
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const headingVariants = cva('font-bold', {
  variants: {
    level: {
      1: 'text-[36px] leading-[43.2px]', // H1 - 36px, line-height: 1.2 × 36 = 43.2px
      2: 'text-[28px] leading-[33.6px]', // H2 - 28px, line-height: 1.2 × 28 = 33.6px
      3: 'text-[24px] leading-[28.8px]', // H3 - 24px, line-height: 1.2 × 24 = 28.8px
      4: 'text-[20px] leading-[24px]',   // H4 - 20px, line-height: 1.2 × 20 = 24px
      5: 'text-[18px] leading-[21.6px]', // H5 - 18px, line-height: 1.2 × 18 = 21.6px
      6: 'text-[16px] leading-[19.2px]', // H6 - 16px, line-height: 1.2 × 16 = 19.2px
    },
    gradient: {
      true: 'bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent',
      false: '',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    level: 2,
    gradient: false,
    align: 'left',
  },
});

const Heading = memo(function Heading({
  level = 2,
  className,
  gradient = false,
  align = 'left',
  children,
  ...props
}) {
  const Tag = `h${level}`;

  return (
    <Tag
      className={clsx(headingVariants({ level, gradient, align }), className)}
      {...props}
    >
      {children}
    </Tag>
  );
});

export default Heading;
