import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { memo } from 'react';

/**
 * Heading component with responsive sizing using CSS variables
 *
 * Uses the design system typography scale that automatically
 * adjusts across mobile, tablet, desktop, and TV.
 *
 * @param {1|2|3|4} level - Heading level (1-4)
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const headingVariants = cva('font-bold leading-tight', {
  variants: {
    level: {
      1: 'text-responsive-4xl', // H1 - Page titles
      2: 'text-responsive-3xl', // H2 - Section titles
      3: 'text-responsive-2xl', // H3 - Subsection titles
      4: 'text-responsive-xl',  // H4 - Card titles
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
