import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { DeviceContext } from '../App';

export default function BottomNav() {
  const location = useLocation();
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.screenWidth >= 768;

  const tabs = [
    {
      name: 'Radio',
      path: '/',
      icon: (active) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Știri',
      path: '/news',
      icon: (active) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    }
  ];

  // Hide bottom nav on split-screen (both pages visible) or TV (keyboard/remote navigation)
  if (isSplitScreen || device?.isTV) {
    return null;
  }

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      md:h-20
      tv:hidden
    ">
      {/* Glassmorphic background */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/95 to-dark-bg/80 backdrop-blur-2xl border-t border-white/10" />

      {/* Glow effect at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="
        relative mx-auto flex items-center justify-around
        px-4 py-2
        md:px-8 md:py-4
        lg:max-w-desktop
      ">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="
                relative flex flex-col items-center gap-1
                py-2 px-4
                md:py-3 md:px-8
                lg:px-10
              "
            >
              {isActive && (
                <>
                  {/* Glassmorphic active background */}
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-md rounded-2xl border border-primary/30"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />

                  {/* Glow effect */}
                  <motion.div
                    layoutId="activeGlow"
                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-lg rounded-2xl"
                    initial={false}
                  />
                </>
              )}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-white/50'}`}
              >
                <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8">
                  {tab.icon(isActive)}
                </div>
              </motion.div>
              <span className={`
                relative z-10 font-semibold transition-colors
                text-xs md:text-sm lg:text-base
                ${isActive ? 'text-primary' : 'text-white/50'}
              `}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
