import { motion } from 'framer-motion';

export default function Loader({ size = 'medium', text = '' }) {
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizes[size]} relative`}>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      {text && (
        <p className="text-white/60 text-sm">{text}</p>
      )}
    </div>
  );
}
