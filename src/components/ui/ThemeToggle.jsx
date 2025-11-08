import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Theme toggle button component
 *
 * Switches between dark and light modes with smooth animations.
 * Displays sun icon for light mode, moon icon for dark mode.
 */
const ThemeToggle = memo(function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`relative rounded-full p-2 overflow-hidden backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors tv-focusable ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-white/5 hover:bg-white/10 transition-colors" />

      {/* Icon */}
      <div className="relative w-6 h-6 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            rotate: isDark ? 0 : 180,
            scale: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          {/* Moon icon (dark mode) */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            rotate: isDark ? 180 : 0,
            scale: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          {/* Sun icon (light mode) */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-primary"
          >
            <circle cx="12" cy="12" r="5" strokeWidth={2} />
            <line x1="12" y1="1" x2="12" y2="3" strokeWidth={2} strokeLinecap="round" />
            <line x1="12" y1="21" x2="12" y2="23" strokeWidth={2} strokeLinecap="round" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth={2} strokeLinecap="round" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth={2} strokeLinecap="round" />
            <line x1="1" y1="12" x2="3" y2="12" strokeWidth={2} strokeLinecap="round" />
            <line x1="21" y1="12" x2="23" y2="12" strokeWidth={2} strokeLinecap="round" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth={2} strokeLinecap="round" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </motion.div>
      </div>
    </motion.button>
  );
});

export default ThemeToggle;
