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
  const isSplitScreen = device?.screenWidth >= 768;

  // Base padding for different sections (using CSS variables)
  const paddingClasses = {
    radio: noPadding
      ? ''
      : isSplitScreen
      ? 'px-4 py-6'
      : 'px-4 py-6 md:px-8 md:py-10 lg:px-8 lg:py-8 tv:px-12 tv:py-12',
    news: noPadding
      ? ''
      : isSplitScreen
      ? 'px-4 pt-0 pb-6'
      : 'px-4 pt-6 pb-20 md:px-6 md:pt-8 md:pb-24 lg:px-8 tv:px-12 tv:pt-10 tv:pb-16',
    article: noPadding
      ? ''
      : isSplitScreen
      ? 'px-4 py-4'
      : 'px-4 py-4 md:px-6 md:py-6 lg:px-8 tv:px-12 tv:py-10',
    default: noPadding ? '' : 'px-4 py-4 md:px-6 md:py-6 lg:px-8 tv:px-12 tv:py-8',
  };

  // Height classes for different sections
  const heightClasses = {
    radio: isSplitScreen
      ? 'h-full'
      : device?.isTablet || device?.isDesktop
      ? 'min-h-[calc(100vh-100px)]'
      : 'min-h-[calc(100vh-80px)]',
    news: isSplitScreen ? 'h-full overflow-y-auto scrollbar-hide' : '',
    article: isSplitScreen ? 'h-full overflow-y-auto scrollbar-hide' : '',
    default: '',
  };

  // Layout classes
  const layoutClasses = {
    radio: isSplitScreen
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
      data-split-screen={isSplitScreen}
      data-section={section}
      {...props}
    >
      {children}
    </div>
  );
}
