import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

/**
 * Button component - Clean minimalist design
 *
 * Design specs:
 * - Solid colors (no glassmorphism)
 * - Subtle shadows for depth
 * - Border radius: 8-10px
 * - Micro-interactions: press ripple and scale
 *
 * @param {'primary'|'secondary'|'ghost'|'outline'} variant - Visual style
 * @param {'small'|'normal'|'medium'|'large'} size - Button size
 * @param {boolean} fullWidth - Expand to full container width
 * @param {boolean} icon - Icon-only button (circular)
 * @param {React.ReactNode} children - Button content
 */

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed focusable',
  {
    variants: {
      variant: {
        primary: '',
        secondary: '',
        ghost: '',
        outline: '',
      },
      size: {
        small: 'text-[12px]',
        normal: 'text-[14px]',
        medium: 'text-[16px]',
        large: 'text-[18px]',
      },
      radius: {
        base: 'rounded-lg',   // 8px
        large: 'rounded-[10px]', // 10px
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
      // Padding for non-icon buttons
      {
        icon: false,
        size: 'small',
        className: 'px-4 py-2',
      },
      {
        icon: false,
        size: 'normal',
        className: 'px-5 py-2.5',
      },
      {
        icon: false,
        size: 'medium',
        className: 'px-6 py-3',
      },
      {
        icon: false,
        size: 'large',
        className: 'px-7 py-3.5',
      },
      // Icon buttons
      {
        icon: true,
        size: 'small',
        className: 'w-9 h-9',
      },
      {
        icon: true,
        size: 'normal',
        className: 'w-10 h-10',
      },
      {
        icon: true,
        size: 'medium',
        className: 'w-12 h-12',
      },
      {
        icon: true,
        size: 'large',
        className: 'w-14 h-14',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'normal',
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
      size = 'normal',
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
    // Solid color backgrounds (no blur, no glassmorphism)
    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md active:shadow-sm',
      secondary: 'bg-secondary text-white hover:bg-secondary-dark shadow-sm hover:shadow-md active:shadow-sm',
      ghost: 'bg-transparent text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary',
      outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:bg-primary/10',
    }[variant];

    return (
      <motion.button
        ref={ref}
        type={type}
        // Subtle micro-interactions
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          buttonVariants({ variant, size, radius, fullWidth, icon }),
          variantStyles,
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
