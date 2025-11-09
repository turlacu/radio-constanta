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
      {/* Cover Art - Visual Hierarchy #1 with clean white card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
        className="relative w-full mb-8 max-w-[360px]"
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

        {/* Main cover art card - clean dark card with shadow */}
        <div className="relative w-full aspect-square rounded-[16px] overflow-hidden bg-bg-tertiary shadow-xl border border-border">
          <motion.img
            src={currentStation.coverArt}
            alt={`${currentStation.name} cover art`}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          />

          {/* Live indicator - clean badge */}
          {isPlaying && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-error/90 backdrop-blur-sm flex items-center gap-2 shadow-md"
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-white rounded-full"
                aria-hidden="true"
              />
              <Caption
                uppercase
                weight="semibold"
                className="text-white text-[10px]"
              >
                Live
              </Caption>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Controls Container */}
      <div className="flex flex-col items-center w-full">
        {/* Station Info */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <Heading level={2} className="mb-2">
            {currentStation.name}
          </Heading>
          {metadata && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Body size="normal" opacity="secondary" weight="medium">
                {metadata}
              </Body>
            </motion.div>
          )}
        </motion.div>

        {/* Play/Pause Button - Clean circular button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.05 }}
          whileTap={{ scale: isLoading ? 1 : 0.95 }}
          onClick={togglePlay}
          disabled={isLoading}
          tabIndex={0}
          className="relative rounded-full disabled:opacity-40 group focusable mb-8 w-20 h-20 bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all"
          aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
        >
          <div className="w-full h-full flex items-center justify-center">
            {isLoading ? (
              <Loader size="small" />
            ) : isPlaying ? (
              <svg
                className="w-9 h-9 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-9 h-9 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </motion.button>

        {/* Station Selector - Clean pill buttons */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 w-full max-w-xs mb-5"
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
                className={`relative flex-1 rounded-[10px] font-semibold transition-all py-3 px-4 text-[14px] shadow-sm focusable ${
                  isActive
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-md'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary border border-border'
                }`}
                aria-pressed={isActive}
                aria-label={`Switch to ${station.id === 'fm' ? 'FM' : 'Folclor'} station`}
              >
                {station.id === 'fm' ? 'FM' : 'Folclor'}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Quality Selector - Clean compact buttons */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 w-full max-w-xs mb-6"
          role="group"
          aria-label="Quality selection"
        >
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
                transition={{ delay: 0.25 + index * 0.03 }}
                tabIndex={0}
                className={`relative flex-1 rounded-lg font-medium transition-all py-2 px-3 text-[12px] focusable ${
                  isActive
                    ? 'bg-bg-tertiary text-text-primary border-2 border-primary'
                    : 'bg-bg-secondary text-text-tertiary hover:bg-bg-tertiary border border-border'
                }`}
                aria-pressed={isActive}
                aria-label={`Switch to ${quality.label} quality`}
              >
                {quality.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Stream Quality Info - Clean text */}
        {streamInfo && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-text-tertiary text-[12px] font-medium"
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
      </div>
    </ResponsiveContainer>
  );
}
