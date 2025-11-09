import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { DeviceContext } from '../App';
import { Caption } from './ui';

export default function BottomNav() {
  const location = useLocation();
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.screenWidth >= 768;

  const tabs = [
    {
      name: 'Radio',
      path: '/',
      icon: (active) => (
        <svg
          className="w-6 h-6"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 0 : 2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: 'Știri',
      path: '/news',
      icon: (active) => (
        <svg
          className="w-6 h-6"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 0 : 2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
    },
  ];

  // Hide bottom nav on split-screen (both pages visible) or TV (keyboard/remote navigation)
  if (isSplitScreen || device?.isTV) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:h-20 tv:hidden bg-white border-t border-border shadow-lg"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="relative mx-auto flex items-center justify-around px-4 py-2 md:px-8 md:py-4 lg:max-w-desktop">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center gap-1 py-2 px-6 md:py-3 md:px-8 lg:px-10"
              aria-label={`Navigate to ${tab.name}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator - solid background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-bg-tertiary rounded-[10px] border border-primary/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`relative z-10 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-tertiary'
                }`}
              >
                <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8">{tab.icon(isActive)}</div>
              </motion.div>

              <Caption
                weight="semibold"
                className={`relative z-10 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-tertiary'
                }`}
              >
                {tab.name}
              </Caption>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
