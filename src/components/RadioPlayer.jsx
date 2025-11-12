import { motion } from 'framer-motion';
import Loader from './Loader';
import { ResponsiveContainer, Heading, Body, Caption } from './ui';

export default function RadioPlayer({ radioState }) {
  const {
    isPlaying,
    isLoading,
    currentStation,
    metadata,
    streamInfo,
    stations,
    selectedQuality,
    availableQualities,
    togglePlay,
    switchStation,
    switchQuality,
  } = radioState;

  return (
    <ResponsiveContainer section="radio">
      {/* Horizontal Layout: Cover Art on left, Controls on right */}
      <div className="flex items-center gap-8">
        {/* Cover Art - Left side */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
          className="relative flex-shrink-0"
        >
          {/* Subtle accent glow behind cover (only when playing) */}
          {isPlaying && (
            <motion.div
              animate={{
                opacity: [0.15, 0.25, 0.15],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-6 rounded-[20px] bg-primary/30 blur-2xl"
              aria-hidden="true"
            />
          )}

          {/* Main cover art card */}
          <div className="relative w-[280px] h-[280px] rounded-[16px] overflow-hidden bg-white border border-border">
            <motion.img
              src={currentStation.coverArt}
              alt={`${currentStation.name} cover art`}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />

            {/* Live indicator */}
            {isPlaying && (
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-error/90 backdrop-blur-sm flex items-center gap-1.5"
              >
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1 h-1 bg-white rounded-full"
                  aria-hidden="true"
                />
                <Caption
                  uppercase
                  weight="semibold"
                  className="text-white text-[8px]"
                >
                  Live
                </Caption>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Controls - Right side */}
        <div className="flex flex-col items-start">
          {/* Play/Pause Button at top */}
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            onClick={togglePlay}
            disabled={isLoading}
            tabIndex={0}
            className="relative rounded-full disabled:opacity-40 group focusable mb-4 w-16 h-16 bg-primary hover:bg-primary-dark transition-all"
            aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
          >
            <div className="w-full h-full flex items-center justify-center">
              {isLoading ? (
                <Loader size="small" />
              ) : isPlaying ? (
                <svg
                  className="w-7 h-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </motion.button>

          {/* Station Name */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <Heading level={3} className="text-left">
              {currentStation.name}
            </Heading>
          </motion.div>

          {/* Station Selector - FM/Folclor tabs */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 mb-4"
            role="group"
            aria-label="Station selection"
          >
            {stations.map((station, index) => {
              const isActive = currentStation.id === station.id;
              return (
                <motion.button
                  key={station.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => switchStation(station)}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  tabIndex={0}
                  className={`relative rounded-[10px] font-semibold transition-all py-2.5 px-8 text-[14px] focusable ${
                    isActive
                      ? 'bg-primary text-white hover:bg-primary-dark border border-primary'
                      : 'bg-transparent text-text-secondary hover:bg-bg-tertiary border border-border'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Switch to ${station.id === 'fm' ? 'FM' : 'Folclor'} station`}
                >
                  {station.id === 'fm' ? 'FM' : 'Folclor'}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Stream Quality Info */}
          {streamInfo && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 text-text-tertiary text-[12px] font-medium mb-3"
              role="status"
              aria-label="Stream information"
            >
              <span>{streamInfo.format}</span>
              <span className="bg-border rounded-full w-1 h-1" aria-hidden="true" />
              <span>{streamInfo.bitrate}</span>
              <span className="bg-border rounded-full w-1 h-1" aria-hidden="true" />
              <span>{streamInfo.channels}</span>
              <span className="bg-border rounded-full w-1 h-1" aria-hidden="true" />
              <span>{streamInfo.sampleRate}</span>
            </motion.div>
          )}

          {/* Bitrate display and Quality Selector */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            {/* Current bitrate display */}
            <div className="text-text-tertiary text-[12px] font-medium">
              {streamInfo?.bitrate || '128 kbps'}
            </div>

            {/* Quality Selector dropdown-style */}
            <div className="flex gap-2" role="group" aria-label="Quality selection">
              {availableQualities.map((quality, index) => {
                const isActive = selectedQuality === quality.id;
                return (
                  <motion.button
                    key={quality.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => switchQuality(quality.id)}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 + index * 0.03 }}
                    tabIndex={0}
                    className={`relative rounded-lg font-medium transition-all py-1.5 px-4 text-[12px] focusable ${
                      isActive
                        ? 'bg-bg-tertiary text-text-primary border border-primary'
                        : 'bg-bg-secondary text-text-tertiary hover:bg-bg-tertiary border border-border'
                    }`}
                    aria-pressed={isActive}
                    aria-label={`Switch to ${quality.label} quality`}
                  >
                    {quality.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
