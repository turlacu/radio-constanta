import { motion } from 'framer-motion';
import Loader from './Loader';

export default function RadioPlayer({ radioState }) {
  const { isPlaying, isLoading, currentStation, currentQuality, metadata, streamInfo, stations, debugInfo, togglePlay, switchStation, switchQuality } = radioState;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">

      {/* Debug Info - Show only on mobile when not empty */}
      {debugInfo && (
        <div className="fixed top-2 left-2 right-2 bg-black/90 text-green-400 text-xs p-2 rounded z-50 max-h-32 overflow-auto font-mono">
          <div className="whitespace-pre-wrap">{debugInfo}</div>
        </div>
      )}

      {/* Cover Art */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 w-full max-w-sm px-6"
      >
        {/* Background glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentStation.color} blur-3xl opacity-50`} />

        {/* Animated ring when playing */}
        {isPlaying && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'} 50%, transparent 100%)`,
                filter: 'blur(20px)',
                opacity: 0.6
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              style={{ filter: 'blur(4px)' }}
            />
          </>
        )}

        {/* Cover art - clean, no overlay */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden card-shadow">
          <img
            src={currentStation.coverArt}
            alt={currentStation.name}
            className="w-full h-full object-contain bg-white"
          />
        </div>
      </motion.div>

      {/* Station Info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-shadow">{currentStation.name}</h2>
        {metadata && (
          <p className="text-white/60 text-sm">{metadata}</p>
        )}
        {isPlaying && (
          <p className="text-primary text-sm mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Live
          </p>
        )}
      </div>

      {/* Play/Pause Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        disabled={isLoading}
        className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center card-shadow mb-8 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader size="small" />
        ) : isPlaying ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </motion.button>

      {/* Station Selector */}
      <div className="flex gap-3 w-full max-w-xs mb-4">
        {stations.map((station) => (
          <motion.button
            key={station.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => switchStation(station)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              currentStation.id === station.id
                ? 'bg-primary text-white card-shadow'
                : 'bg-dark-card text-white/60 hover:bg-dark-card/80'
            }`}
          >
            {station.id === 'fm' ? 'FM' : 'Folclor'}
          </motion.button>
        ))}
      </div>

      {/* Quality Selector */}
      <div className="w-full max-w-xs mb-4">
        <div className="text-xs text-white/40 mb-2 text-center">Calitate audio</div>
        <div className="flex gap-2">
          {currentStation.qualities.map((quality) => (
            <motion.button
              key={quality.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => switchQuality(quality)}
              disabled={isLoading}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all disabled:opacity-50 ${
                currentQuality.id === quality.id
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-dark-card text-white/40 hover:bg-dark-card/80'
              }`}
            >
              {quality.format === 'FLAC' ? 'FLAC' : quality.bitrate.replace(' kbps', 'k')}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stream Quality Info */}
      {streamInfo && (
        <div className="flex items-center justify-center gap-2 text-xs text-white/50">
          <span>{streamInfo.format}</span>
          <span>•</span>
          <span>{streamInfo.bitrate}</span>
          <span>•</span>
          <span>{streamInfo.channels}</span>
          <span>•</span>
          <span>{streamInfo.sampleRate}</span>
        </div>
      )}
    </div>
  );
}
