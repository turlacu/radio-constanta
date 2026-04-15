import { useContext } from 'react';
import { DeviceContext } from '../../App';
import { clsx } from 'clsx';

/**
 * ResponsiveContainer - Handles split-screen logic centrally
 *
 * This component eliminates the need for split-screen conditionals
 * scattered throughout child components. It automatically detects
 * when the app is in split-screen mode (768px+) and applies
 * appropriate styling.
 *
 * @param {'radio'|'news'|'article'|'default'} section - Content section
 * @param {boolean} noPadding - Remove default padding
 * @param {React.ReactNode} children - Content
 */

export default function ResponsiveContainer({
  section = 'default',
  noPadding = false,
  className,
  children,
  ...props
}) {
  const device = useContext(DeviceContext);
  const isDesktopShell = device?.policy?.isDesktopShell;
  const isInlineNewsShell = device?.policy?.canShowNewsRail;

  // Base padding for different sections (using CSS variables)
  const paddingClasses = {
    radio: noPadding
      ? ''
      : isDesktopShell
      ? 'w-full px-[clamp(1rem,0.9rem+0.42vw,2.4rem)] py-[clamp(1.25rem,1.05rem+0.85vw,3rem)]'
      : 'px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] py-[clamp(1.25rem,1.05rem+0.85vw,3rem)]',
    news: noPadding
      ? ''
      : isInlineNewsShell
      ? 'px-[clamp(1rem,0.9rem+0.38vw,2rem)] pt-0 pb-[clamp(1.5rem,1.32rem+0.7vw,2.6rem)]'
      : 'px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] pt-[clamp(1.5rem,1.32rem+0.72vw,2.8rem)] pb-[clamp(4.5rem,4rem+1.8vw,6.5rem)]',
    article: noPadding
      ? ''
      : isInlineNewsShell
      ? 'px-[clamp(1rem,0.9rem+0.38vw,2rem)] py-[clamp(1rem,0.9rem+0.42vw,1.9rem)]'
      : 'px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] py-[clamp(1rem,0.9rem+0.48vw,2.4rem)]',
    default: noPadding ? '' : 'px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] py-[clamp(1rem,0.9rem+0.48vw,2.1rem)]',
  };

  // Height classes for different sections
  const heightClasses = {
    radio: isDesktopShell
      ? 'h-full min-h-0'
      : 'min-app-height',
    news: isInlineNewsShell ? 'h-full overflow-y-auto scrollbar-hide' : '',
    article: isInlineNewsShell ? 'h-full overflow-y-auto scrollbar-hide' : '',
    default: '',
  };

  // Layout classes
  const layoutClasses = {
    radio: isDesktopShell
      ? 'flex items-center justify-center relative overflow-hidden flex-col'
      : 'flex items-center justify-center relative overflow-hidden flex-col',
    news: '',
    article: '',
    default: '',
  };

  return (
    <div
      className={clsx(
        paddingClasses[section],
        heightClasses[section],
        layoutClasses[section],
        className
      )}
      data-split-screen={isInlineNewsShell}
      data-desktop-shell={isDesktopShell}
      data-section={section}
      {...props}
    >
      {children}
    </div>
  );
}
