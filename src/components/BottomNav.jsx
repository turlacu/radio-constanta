import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-card/95 backdrop-blur-lg border-t border-white/10 z-40">
      <div className="max-w-mobile mx-auto flex items-center justify-around px-6 py-3">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center gap-1 py-2 px-6 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <div className={`relative z-10 ${isActive ? 'text-primary' : 'text-white/50'}`}>
                {tab.icon(isActive)}
              </div>
              <span className={`relative z-10 text-xs font-medium ${isActive ? 'text-primary' : 'text-white/50'}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
