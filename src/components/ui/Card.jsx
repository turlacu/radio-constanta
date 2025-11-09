import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

/**
 * Card component - Clean minimalist design
 *
 * Design specs:
 * - Solid white background (no glassmorphism or blur)
 * - Subtle shadows for depth
 * - Border radius: 10-12px
 * - Clean borders
 * - Hover lift effect for interactive cards
 *
 * @param {'default'|'elevated'|'flat'} variant - Visual style
 * @param {boolean} interactive - Add hover effects for clickable cards
 * @param {React.ReactNode} children - Card content
 */

const cardVariants = cva('relative overflow-hidden transition-all', {
  variants: {
    variant: {
      default: 'bg-white border border-border shadow-sm',
      elevated: 'bg-white border border-border shadow-md',
      flat: 'bg-bg-tertiary border border-transparent',
    },
    radius: {
      base: 'rounded-[10px]',  // 10px
      large: 'rounded-[12px]', // 12px
    },
    padding: {
      none: '',
      '8': 'p-2',
      '16': 'p-4',
      '24': 'p-6',
      '32': 'p-8',
    },
    interactive: {
      true: 'cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    radius: 'large',
    padding: '16',
    interactive: false,
  },
});

const Card = forwardRef(
  (
    {
      variant = 'default',
      radius = 'large',
      padding = '16',
      interactive = false,
      className,
      children,
      onClick,
      onKeyDown,
      tabIndex,
      ...props
    },
    ref
  ) => {
    // Hover effects for interactive cards
    const hoverStyles = interactive
      ? 'hover:shadow-lg hover:-translate-y-0.5'
      : '';

    const Component = interactive ? motion.div : 'div';
    const motionProps = interactive
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          whileHover: { y: -2 },
          whileTap: { scale: 0.99 },
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
          },
        }
      : {};

    return (
      <Component
        ref={ref}
        className={clsx(
          cardVariants({ variant, radius, padding, interactive }),
          hoverStyles,
          className
        )}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={interactive ? tabIndex ?? 0 : tabIndex}
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;
