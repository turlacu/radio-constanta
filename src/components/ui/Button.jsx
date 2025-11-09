import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

/**
 * Button component following design system specifications
 *
 * Design specs:
 * - Padding L/R: 5× font size
 * - Padding T/B: 1× font size
 * - Sizes: small (14px), normal (16px), medium (18px), large (20px)
 * - Colors: Primary, Secondary, Default, Outline variants
 *
 * @param {'primary'|'secondary'|'default'|'outline'} variant - Visual style
 * @param {'small'|'normal'|'medium'|'large'} size - Button size
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
        default: '',
        outline: '',
      },
      size: {
        small: 'text-[14px]',    // 14px - Small
        normal: 'text-[16px]',   // 16px - Normal
        medium: 'text-[18px]',   // 18px - Medium
        large: 'text-[20px]',    // 20px - Large
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
      // Padding for non-icon buttons: 5× font size L/R, 1× T/B
      {
        icon: false,
        size: 'small',
        className: 'px-[70px] py-[14px]',  // 5×14px L/R, 1×14px T/B
      },
      {
        icon: false,
        size: 'normal',
        className: 'px-[80px] py-[16px]',  // 5×16px L/R, 1×16px T/B
      },
      {
        icon: false,
        size: 'medium',
        className: 'px-[90px] py-[18px]',  // 5×18px L/R, 1×18px T/B
      },
      {
        icon: false,
        size: 'large',
        className: 'px-[100px] py-[20px]', // 5×20px L/R, 1×20px T/B
      },
      // Size for icon buttons
      {
        icon: true,
        size: 'small',
        className: 'w-[44px] h-[44px]',   // 44px touch target
      },
      {
        icon: true,
        size: 'normal',
        className: 'w-[48px] h-[48px]',
      },
      {
        icon: true,
        size: 'medium',
        className: 'w-[56px] h-[56px]',
      },
      {
        icon: true,
        size: 'large',
        className: 'w-[64px] h-[64px]',
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
    // Background styles based on variant (using new color scheme)
    const backgroundClass = {
      primary: 'bg-[#092C4C]',              // Primary brand color
      secondary: 'bg-[#F2994A]',            // Secondary brand color
      default: 'bg-gray2',                  // Gray from palette
      outline: 'bg-transparent',            // Transparent for outline
    }[variant];

    // Border styles based on variant
    const borderClass = {
      primary: 'border-2 border-white/20',
      secondary: 'border-2 border-white/20',
      default: 'border border-gray4',
      outline: 'border-2 border-primary',
    }[variant];

    // Text color based on variant
    const textClass = {
      primary: 'text-white',
      secondary: 'text-white',
      default: 'text-white',
      outline: 'text-primary',
    }[variant];

    // Hover states
    const hoverClass = {
      primary: 'hover:bg-[#0a3a5f]',
      secondary: 'hover:bg-[#f5a461]',
      default: 'hover:bg-gray3',
      outline: 'hover:bg-primary/10',
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
          backgroundClass,
          borderClass,
          textClass,
          hoverClass,
          'transition-colors duration-300',
          className
        )}
        {...props}
      >
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
