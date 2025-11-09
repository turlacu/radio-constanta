import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

/**
 * Card component following design system specifications
 *
 * Design specs:
 * - Uses 8px-based spacing system (8, 16, 24, 32px padding options)
 * - Consistent border radius, shadow, and typography
 * - Supports interactive states with proper hover/focus
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
      '8': 'p-[8px]',      // 8px
      '16': 'p-[16px]',    // 16px
      '24': 'p-[24px]',    // 24px
      '32': 'p-[32px]',    // 32px
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
    padding: '16',
    interactive: false,
    focusable: false,
  },
});

const Card = forwardRef(
  (
    {
      variant = 'glass',
      radius = 'large',
      padding = '16',
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
    // Background styles based on variant (using new color scheme)
    const backgroundClass = {
      glass: 'bg-gradient-to-br from-gray3/20 to-gray2/10 backdrop-blur-xl border border-gray4/20',
      elevated:
        'bg-gradient-to-br from-gray3/30 to-gray2/15 backdrop-blur-xl border border-gray4/30',
      flat: 'bg-gray2/20 border border-gray3/20',
    }[variant];

    // Hover effects for interactive cards (using primary color)
    const hoverClass = interactive
      ? 'transition-all hover:border-[#092C4C]/40 hover:shadow-[0_0_20px_rgba(9,44,76,0.3)]'
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

        {/* Glow effect on hover for interactive cards (using primary color) */}
        {interactive && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.5 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              'absolute inset-0 bg-gradient-to-br from-[#092C4C]/20 to-transparent blur-xl',
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
