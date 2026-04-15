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
  'relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focusable motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: '',
        secondary: '',
        ghost: '',
        outline: '',
      },
      size: {
        small: 'text-responsive-xs',
        normal: 'text-responsive-sm',
        medium: 'text-responsive-base',
        large: 'text-responsive-lg',
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
        className: 'px-[clamp(0.875rem,0.83rem+0.18vw,1rem)] py-[clamp(0.5rem,0.46rem+0.14vw,0.625rem)]',
      },
      {
        icon: false,
        size: 'normal',
        className: 'px-[clamp(1rem,0.92rem+0.28vw,1.25rem)] py-[clamp(0.625rem,0.56rem+0.2vw,0.8rem)]',
      },
      {
        icon: false,
        size: 'medium',
        className: 'px-[clamp(1.125rem,1.02rem+0.38vw,1.5rem)] py-[clamp(0.75rem,0.67rem+0.22vw,0.95rem)]',
      },
      {
        icon: false,
        size: 'large',
        className: 'px-[clamp(1.25rem,1.12rem+0.48vw,1.75rem)] py-[clamp(0.875rem,0.78rem+0.28vw,1.1rem)]',
      },
      // Icon buttons
      {
        icon: true,
        size: 'small',
        className: 'w-[clamp(2.1rem,2rem+0.32vw,2.35rem)] h-[clamp(2.1rem,2rem+0.32vw,2.35rem)]',
      },
      {
        icon: true,
        size: 'normal',
        className: 'w-[clamp(2.35rem,2.2rem+0.42vw,2.7rem)] h-[clamp(2.35rem,2.2rem+0.42vw,2.7rem)]',
      },
      {
        icon: true,
        size: 'medium',
        className: 'w-[clamp(2.75rem,2.55rem+0.55vw,3.15rem)] h-[clamp(2.75rem,2.55rem+0.55vw,3.15rem)]',
      },
      {
        icon: true,
        size: 'large',
        className: 'w-[clamp(3.15rem,2.95rem+0.7vw,3.75rem)] h-[clamp(3.15rem,2.95rem+0.7vw,3.75rem)]',
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
      <button
        ref={ref}
        type={type}
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
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
