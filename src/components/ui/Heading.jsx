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

const headingVariants = cva('font-sans font-bold', {
  variants: {
    level: {
      1: 'text-responsive-4xl leading-[1.08]',
      2: 'text-responsive-3xl leading-[1.1]',
      3: 'text-responsive-2xl leading-[1.12]',
      4: 'text-responsive-xl leading-[1.15]',
      5: 'text-responsive-lg leading-[1.18]',
      6: 'text-responsive-base leading-[1.2]',
    },
    color: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      custom: '', // For custom colors via className
    },
    gradient: {
      true: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
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
    color: 'primary',
    gradient: false,
    align: 'left',
  },
});

const Heading = memo(function Heading({
  level = 2,
  className,
  color = 'primary',
  gradient = false,
  align = 'left',
  children,
  ...props
}) {
  const Tag = `h${level}`;

  return (
    <Tag
      className={clsx(headingVariants({ level, color, gradient, align }), className)}
      {...props}
    >
      {children}
    </Tag>
  );
});

export default Heading;
