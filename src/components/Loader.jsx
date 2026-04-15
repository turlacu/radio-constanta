import { memo } from 'react';

const Loader = memo(function Loader({ size = 'medium', text = '' }) {
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-loader-pulse" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-loader-spin" />
      </div>
      {text && (
        <p className="text-white/60 text-sm">{text}</p>
      )}
    </div>
  );
});

export default Loader;
