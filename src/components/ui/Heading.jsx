import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { memo } from 'react';

/**
 * Heading component following design system specifications
 *
 * Typography specs:
 * - H1: 56px, H2: 48px, H3: 40px, H4: 32px, H5: 24px, H6: 20px
 * - Line height: 1.1× font size for all headings
 * - Font weight: Bold
 *
 * @param {1|2|3|4|5|6} level - Heading level (1-6)
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const headingVariants = cva('font-bold', {
  variants: {
    level: {
      1: 'text-[56px] leading-[61.6px]', // H1 - 56px, line-height: 1.1 × 56 = 61.6px
      2: 'text-[48px] leading-[52.8px]', // H2 - 48px, line-height: 1.1 × 48 = 52.8px
      3: 'text-[40px] leading-[44px]',   // H3 - 40px, line-height: 1.1 × 40 = 44px
      4: 'text-[32px] leading-[35.2px]', // H4 - 32px, line-height: 1.1 × 32 = 35.2px
      5: 'text-[24px] leading-[26.4px]', // H5 - 24px, line-height: 1.1 × 24 = 26.4px
      6: 'text-[20px] leading-[22px]',   // H6 - 20px, line-height: 1.1 × 20 = 22px
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
