import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

/**
 * Card component with glassmorphic styling
 *
 * Uses design system tokens for consistent styling and spacing.
 * Supports different variants and interactive states.
 *
 * @param {'glass'|'elevated'|'flat'} variant - Visual style
 * @param {boolean} interactive - Add hover effects for clickable cards
 * @param {boolean} focusable - Add TV focus support
 * @param {React.ReactNode} children - Card content
 */

const cardVariants = cva('relative overflow-hidden', {
  variants: {
    variant: {
      glass: '',
      elevated: 'shadow-lg',
      flat: '',
    },
    radius: {
      base: 'rounded-lg',
      large: 'rounded-xl',
      xlarge: 'rounded-2xl',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      responsive: 'p-4 md:p-5 lg:p-6 tv:p-8',
    },
    interactive: {
      true: 'cursor-pointer group',
      false: '',
    },
    focusable: {
      true: 'tv-focusable',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'glass',
    radius: 'large',
    padding: 'md',
    interactive: false,
    focusable: false,
  },
});

const Card = forwardRef(
  (
    {
      variant = 'glass',
      radius = 'large',
      padding = 'md',
      interactive = false,
      focusable = false,
      className,
      children,
      onClick,
      onKeyDown,
      tabIndex,
      ...props
    },
    ref
  ) => {
    // Background styles based on variant
    const backgroundClass = {
      glass: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10',
      elevated:
        'bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-xl border border-white/15',
      flat: 'bg-white/5 border border-white/5',
    }[variant];

    // Hover effects for interactive cards
    const hoverClass = interactive
      ? 'transition-all hover:border-white/20 hover:from-white/15 hover:to-white/8'
      : '';

    // Radius mapping
    const radiusClass = {
      base: 'rounded-lg',
      large: 'rounded-xl',
      xlarge: 'rounded-2xl',
    }[radius];

    const Component = interactive ? motion.div : 'div';
    const motionProps = interactive
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          whileHover: { scale: 1.01 },
          transition: { type: 'spring', stiffness: 100 },
        }
      : {};

    return (
      <Component
        ref={ref}
        className={clsx(
          cardVariants({ variant, radius, padding, interactive, focusable }),
          className
        )}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={focusable ? tabIndex ?? 0 : tabIndex}
        {...motionProps}
        {...props}
      >
        {/* Glassmorphic background */}
        <div
          className={clsx(
            'absolute inset-0',
            backgroundClass,
            hoverClass,
            radiusClass
          )}
        />

        {/* Glow effect on hover for interactive cards */}
        {interactive && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.5 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              'absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur-xl',
              radiusClass
            )}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;
