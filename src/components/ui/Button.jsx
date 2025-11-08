import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

/**
 * Button component with glassmorphic styling and variants
 *
 * Uses design system tokens for consistent sizing and spacing
 * across all device types (mobile, tablet, desktop, TV).
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant - Visual style
 * @param {'sm'|'md'|'lg'|'xl'} size - Button size (scales with device)
 * @param {boolean} fullWidth - Expand to full container width
 * @param {boolean} icon - Icon-only button (circular)
 * @param {React.ReactNode} children - Button content
 */

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-semibold transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed tv-focusable',
  {
    variants: {
      variant: {
        primary: '',
        secondary: '',
        ghost: '',
        danger: '',
      },
      size: {
        sm: 'text-responsive-sm',
        md: 'text-responsive-base',
        lg: 'text-responsive-lg',
        xl: 'text-responsive-xl',
      },
      radius: {
        base: 'rounded-lg',
        large: 'rounded-xl',
        full: 'rounded-full',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      icon: {
        true: 'aspect-square',
        false: '',
      },
    },
    compoundVariants: [
      // Padding for non-icon buttons based on size
      {
        icon: false,
        size: 'sm',
        className: 'px-4 py-2',
      },
      {
        icon: false,
        size: 'md',
        className: 'px-6 py-3',
      },
      {
        icon: false,
        size: 'lg',
        className: 'px-8 py-4',
      },
      {
        icon: false,
        size: 'xl',
        className: 'px-10 py-5',
      },
      // Size for icon buttons
      {
        icon: true,
        size: 'sm',
        className: 'w-10 h-10',
      },
      {
        icon: true,
        size: 'md',
        className: 'w-12 h-12',
      },
      {
        icon: true,
        size: 'lg',
        className: 'w-16 h-16',
      },
      {
        icon: true,
        size: 'xl',
        className: 'w-20 h-20',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      radius: 'large',
      fullWidth: false,
      icon: false,
    },
  }
);

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      radius = 'large',
      fullWidth = false,
      icon = false,
      className,
      children,
      disabled = false,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Background styles based on variant
    const backgroundClass = {
      primary: 'bg-gradient-to-br from-primary/90 to-primary/70',
      secondary: 'bg-gradient-to-br from-white/20 to-white/10',
      ghost: 'bg-transparent hover:bg-white/10',
      danger: 'bg-gradient-to-br from-red-500/90 to-red-600/70',
    }[variant];

    // Border styles based on variant
    const borderClass = {
      primary: 'border-2 border-white/30',
      secondary: 'border border-white/30',
      ghost: 'border border-white/10 hover:border-white/30',
      danger: 'border-2 border-red-400/30',
    }[variant];

    // Text color based on variant
    const textClass = {
      primary: 'text-white',
      secondary: 'text-white',
      ghost: 'text-white/70 hover:text-white',
      danger: 'text-white',
    }[variant];

    // Glow color for variant
    const glowClass = {
      primary: 'from-primary/20 to-transparent',
      secondary: 'from-primary/10 to-transparent',
      ghost: '',
      danger: 'from-red-500/20 to-transparent',
    }[variant];

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          buttonVariants({ variant, size, radius, fullWidth, icon }),
          className
        )}
        {...props}
      >
        {/* Glassmorphic background */}
        <div
          className={clsx(
            'absolute inset-0 backdrop-blur-xl transition-all',
            backgroundClass,
            borderClass,
            radius === 'full' ? 'rounded-full' : radius === 'large' ? 'rounded-xl' : 'rounded-lg'
          )}
        />

        {/* Glow effect (not for ghost) */}
        {variant !== 'ghost' && glowClass && (
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={clsx(
              'absolute inset-0 bg-gradient-to-br blur-lg',
              glowClass,
              radius === 'full' ? 'rounded-full' : radius === 'large' ? 'rounded-xl' : 'rounded-lg'
            )}
          />
        )}

        {/* Content */}
        <span className={clsx('relative z-10 flex items-center justify-center gap-2', textClass)}>
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
