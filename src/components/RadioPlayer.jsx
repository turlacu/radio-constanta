import { motion } from 'framer-motion';
import Loader from './Loader';

export default function RadioPlayer({ radioState }) {
  const { isPlaying, isLoading, currentStation, metadata, streamInfo, stations, togglePlay, switchStation } = radioState;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8 relative overflow-hidden">

      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, #00BFFF 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, #9333EA 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, #00BFFF 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
      </div>

      {/* Cover Art - Circular with glassmorphic effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative mb-8 w-full max-w-[280px]"
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.1, 1] : 1,
            opacity: isPlaying ? [0.5, 0.8, 0.5] : 0.3
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-lg bg-gradient-to-br ${currentStation.color} blur-2xl`}
        />

        {/* Rotating border when playing */}
        {isPlaying && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-lg opacity-60"
            style={{
              background: `conic-gradient(from 0deg, ${currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'}, transparent, ${currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'})`,
              filter: 'blur(8px)'
            }}
          />
        )}

        {/* Glassmorphic outer ring */}
        <div className="absolute -inset-3 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />

        {/* Cover art container - square with small rounded corners */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-4 border-white/10 shadow-2xl">
          <img
            src={currentStation.coverArt}
            alt={currentStation.name}
            className="w-full h-full object-cover"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

          {/* Live indicator - centered at bottom */}
          {isPlaying && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md flex items-center gap-2 border border-white/20"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
              <span className="text-white text-xs font-semibold uppercase tracking-wider">Live</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Station Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8 relative z-10"
      >
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{currentStation.name}</h2>
        {metadata && (
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-white/70 text-sm font-medium"
          >{metadata}</motion.p>
        )}
      </motion.div>

      {/* Play/Pause Button - Large glassmorphic */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        disabled={isLoading}
        className="relative w-24 h-24 rounded-full mb-8 disabled:opacity-50 group"
      >
        {/* Glow effect - purple for folclor, cyan for FM */}
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.3, 1] : 1,
            opacity: isPlaying ? [0.5, 0.8, 0.5] : 0
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-xl ${currentStation.id === 'folclor' ? 'bg-purple-500' : 'bg-primary'}`}
        />

        {/* Glassmorphic button - purple gradient for folclor */}
        <div className={`relative w-full h-full rounded-full backdrop-blur-xl border-2 border-white/30 shadow-2xl flex items-center justify-center group-hover:border-white/50 transition-colors ${
          currentStation.id === 'folclor'
            ? 'bg-gradient-to-br from-purple-500/90 to-purple-600/70'
            : 'bg-gradient-to-br from-primary/90 to-primary/70'
        }`}>
          {isLoading ? (
            <Loader size="small" />
          ) : isPlaying ? (
            <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </motion.button>

      {/* Station Selector - Glassmorphic pills */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 w-full max-w-xs mb-6 relative z-10"
      >
        {stations.map((station, index) => (
          <motion.button
            key={station.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => switchStation(station)}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`relative flex-1 py-3 px-4 rounded-2xl font-semibold text-sm transition-all overflow-hidden ${
              currentStation.id === station.id
                ? 'text-white'
                : 'text-white/60'
            }`}
          >
            {/* Background */}
            <div className={`absolute inset-0 ${
              currentStation.id === station.id
                ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border-2 border-white/30'
                : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10'
            } rounded-2xl transition-all`} />

            {/* Glow for active */}
            {currentStation.id === station.id && (
              <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-lg"
              />
            )}

            <span className="relative z-10">{station.id === 'fm' ? 'FM' : 'Folclor'}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Stream Quality Info - Compact glassmorphic card */}
      {streamInfo && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative px-6 py-3 rounded-2xl overflow-hidden"
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl" />

          <div className="relative flex items-center justify-center gap-3 text-xs text-white/60 font-medium">
            <span>{streamInfo.format}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span>{streamInfo.bitrate}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span>{streamInfo.channels}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span>{streamInfo.sampleRate}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
