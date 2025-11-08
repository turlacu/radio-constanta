import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';

/**
 * Caption component for metadata, labels, and small text
 *
 * Uses the design system typography scale that automatically
 * adjusts across mobile, tablet, desktop, and TV.
 *
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Content
 */

const captionVariants = cva('text-responsive-xs leading-snug', {
  variants: {
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
    opacity: {
      primary: 'text-white/90',
      secondary: 'text-white/70',
      tertiary: 'text-white/50',
      disabled: 'text-white/30',
    },
    uppercase: {
      true: 'uppercase tracking-wider',
      false: '',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    weight: 'medium',
    opacity: 'tertiary',
    uppercase: false,
    align: 'left',
  },
});

export default function Caption({
  weight = 'medium',
  opacity = 'tertiary',
  uppercase = false,
  align = 'left',
  className,
  as: Component = 'span',
  children,
  ...props
}) {
  return (
    <Component
      className={clsx(captionVariants({ weight, opacity, uppercase, align }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
