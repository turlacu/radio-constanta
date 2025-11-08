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
      {/* Blurred gradient background */}
      <div className="absolute inset-0 opacity-30 md:opacity-100">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(0, 191, 255, 0.4) 0%, rgba(0, 150, 200, 0.2) 30%, transparent 60%)',
              'radial-gradient(circle at 70% 60%, rgba(0, 191, 255, 0.35) 0%, rgba(0, 150, 200, 0.15) 30%, transparent 60%)',
              'radial-gradient(circle at 30% 40%, rgba(0, 191, 255, 0.4) 0%, rgba(0, 150, 200, 0.2) 30%, transparent 60%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 blur-3xl"
        />
        <div className="absolute inset-0 backdrop-blur-2xl bg-dark-bg/30 md:block hidden" />
      </div>

      {/* Cover Art - Square with glassmorphic effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative w-full mb-6 max-w-[340px]"
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.05, 1] : 1,
            opacity: isPlaying ? [0.4, 0.6, 0.4] : 0.2,
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 rounded-lg bg-gradient-to-br ${currentStation.color} blur-2xl`}
        />

        {/* Rotating border when playing */}
        {isPlaying && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-lg opacity-40"
            style={{
              background: `conic-gradient(from 0deg, ${
                currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'
              }, transparent, ${
                currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'
              })`,
              filter: 'blur(10px)',
            }}
          />
        )}

        {/* Glassmorphic outer ring */}
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />

        {/* Cover art container - square with rounded corners */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={currentStation.coverArt}
            alt={`${currentStation.name} cover art`}
            className="w-full h-full object-cover"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

          {/* Live indicator - top right overlay */}
          {isPlaying && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-4 right-4 px-4 py-1.5 rounded-lg bg-black/30 backdrop-blur-md flex items-center gap-2 border border-white/20"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-red-500 rounded-full"
                aria-hidden="true"
              />
              <Caption
                uppercase
                weight="semibold"
                opacity="primary"
                className="text-white"
              >
                Live
              </Caption>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Controls Container */}
      <div className="flex flex-col items-center w-full relative z-10">
        {/* Station Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <Heading level={2} gradient className="mb-2">
            {currentStation.name}
          </Heading>
          {metadata && (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Body size="sm" opacity="secondary" weight="medium">
                {metadata}
              </Body>
            </motion.div>
          )}
        </motion.div>

        {/* Play/Pause Button - Large glassmorphic */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.05 }}
          whileTap={{ scale: isLoading ? 1 : 0.95 }}
          onClick={togglePlay}
          disabled={isLoading}
          tabIndex={0}
          className="relative rounded-full disabled:opacity-50 group tv-focusable mb-6 w-16 h-16"
          aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
        >
          {/* Glow effect - purple for folclor, cyan for FM */}
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.2, 1] : 1,
              opacity: isPlaying ? [0.3, 0.5, 0.3] : 0,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 rounded-full blur-2xl ${
              currentStation.id === 'folclor' ? 'bg-purple-500' : 'bg-primary'
            }`}
            aria-hidden="true"
          />

          {/* Glassmorphic button - purple gradient for folclor */}
          <div
            className={`relative w-full h-full rounded-full backdrop-blur-xl border-2 border-white/30 shadow-2xl flex items-center justify-center group-hover:border-white/50 transition-colors ${
              currentStation.id === 'folclor'
                ? 'bg-gradient-to-br from-purple-500/90 to-purple-600/70'
                : 'bg-gradient-to-br from-primary/90 to-primary/70'
            }`}
          >
            {isLoading ? (
              <Loader size="small" />
            ) : isPlaying ? (
              <svg
                className="w-8 h-8 text-white drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-white ml-1 drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </motion.button>

        {/* Station Selector - Glassmorphic buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
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
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                tabIndex={0}
                className={`relative flex-1 rounded-xl font-semibold transition-all overflow-hidden tv-focusable py-3 px-3 text-responsive-xs ${
                  isActive ? 'text-white' : 'text-white/60'
                }`}
                aria-pressed={isActive}
                aria-label={`Switch to ${station.id === 'fm' ? 'FM' : 'Folclor'} station`}
              >
                {/* Background */}
                <div
                  className={`absolute inset-0 ${
                    isActive
                      ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border-2 border-white/30'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10'
                  } rounded-xl transition-all`}
                />

                {/* Glow for active */}
                {isActive && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-lg"
                    aria-hidden="true"
                  />
                )}

                <span className="relative z-10">
                  {station.id === 'fm' ? 'FM' : 'Folclor'}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Quality Selector - Glassmorphic buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 w-full max-w-xs mb-5"
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
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                tabIndex={0}
                className={`relative flex-1 rounded-lg font-medium transition-all overflow-hidden tv-focusable py-2 px-2 text-responsive-xs ${
                  isActive ? 'text-white' : 'text-white/50'
                }`}
                aria-pressed={isActive}
                aria-label={`Switch to ${quality.label} quality`}
              >
                {/* Background */}
                <div
                  className={`absolute inset-0 ${
                    isActive
                      ? 'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10'
                  } rounded-lg transition-all`}
                />

                {/* Glow for active */}
                {isActive && (
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur"
                    aria-hidden="true"
                  />
                )}

                <span className="relative z-10">{quality.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Stream Quality Info */}
        {streamInfo && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 text-primary font-medium text-responsive-xs"
            role="status"
            aria-label="Stream information"
          >
            <span>{streamInfo.format}</span>
            <span className="bg-white/30 rounded-full w-1 h-1" aria-hidden="true" />
            <span>{streamInfo.bitrate}</span>
            <span className="bg-white/30 rounded-full w-1 h-1" aria-hidden="true" />
            <span>{streamInfo.channels}</span>
            <span className="bg-white/30 rounded-full w-1 h-1" aria-hidden="true" />
            <span>{streamInfo.sampleRate}</span>
          </motion.div>
        )}
      </div>
    </ResponsiveContainer>
  );
}
