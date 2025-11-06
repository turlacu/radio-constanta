import { motion } from 'framer-motion';
import { useContext } from 'react';
import Loader from './Loader';
import { DeviceContext } from '../App';

export default function RadioPlayer({ radioState }) {
  const { isPlaying, isLoading, currentStation, metadata, streamInfo, stations, selectedQuality, availableQualities, togglePlay, switchStation, switchQuality } = radioState;
  const device = useContext(DeviceContext);

  // Check if we're in split-screen mode (768px+)
  const isSplitScreen = device?.screenWidth >= 768;

  // Responsive layout classes based on device type
  const containerClasses = `
    flex items-center justify-center relative overflow-hidden
    px-4 py-6
    md:px-8 md:py-10
    lg:px-8 lg:py-8
    tv:px-12 tv:py-12
    ${device?.isTV && !isSplitScreen ? 'flex-row gap-16' : 'flex-col'}
    ${isSplitScreen ? 'h-full' : device?.isTablet || device?.isDesktop ? 'min-h-[calc(100vh-100px)]' : 'min-h-[calc(100vh-80px)]'}
  `;

  return (
    <div className={containerClasses}>

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

      {/* Cover Art - Square with glassmorphic effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className={`
          relative w-full
          max-w-[340px] mb-6
          md:max-w-[400px] md:mb-8
          lg:max-w-[480px] lg:mb-10
          tv:max-w-[600px] tv:mb-0 tv:flex-shrink-0
        `}
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.05, 1] : 1,
            opacity: isPlaying ? [0.4, 0.6, 0.4] : 0.2
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-lg bg-gradient-to-br ${currentStation.color} blur-2xl`}
        />

        {/* Rotating border when playing */}
        {isPlaying && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-lg opacity-40"
            style={{
              background: `conic-gradient(from 0deg, ${currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'}, transparent, ${currentStation.color.includes('blue') ? '#00BFFF' : '#9333EA'})`,
              filter: 'blur(10px)'
            }}
          />
        )}

        {/* Glassmorphic outer ring */}
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />

        {/* Cover art container - square with small rounded corners */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={currentStation.coverArt}
            alt={currentStation.name}
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
              />
              <span className="text-white text-xs font-semibold uppercase tracking-wider">Live</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Controls Container - vertical on mobile/tablet/desktop, part of horizontal on TV */}
      <div className="flex flex-col items-center w-full tv:flex-1 tv:items-start relative z-10">
        {/* Station Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`
            text-center mb-6
            md:mb-8
            tv:text-left tv:mb-10
          `}
        >
          <h2 className="
            text-2xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent
            md:text-3xl
            lg:text-4xl
            tv:text-5xl
          ">
            {currentStation.name}
          </h2>
          {metadata && (
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="
                text-white/70 font-medium
                text-sm md:text-base lg:text-lg tv:text-2xl
              "
            >{metadata}</motion.p>
          )}
        </motion.div>

        {/* Play/Pause Button - Large glassmorphic */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          disabled={isLoading}
          tabIndex={0}
          className={`
            relative rounded-full disabled:opacity-50 group tv-focusable
            w-16 h-16 mb-6
            md:w-20 md:h-20 md:mb-8
            lg:w-24 lg:h-24
            tv:w-32 tv:h-32 tv:mb-12
          `}
        >
        {/* Glow effect - purple for folclor, cyan for FM - smoother and slower */}
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.2, 1] : 1,
            opacity: isPlaying ? [0.3, 0.5, 0.3] : 0
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-full blur-2xl ${currentStation.id === 'folclor' ? 'bg-purple-500' : 'bg-primary'}`}
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
            <svg className="
              w-8 h-8 text-white drop-shadow-lg
              md:w-10 md:h-10
              lg:w-12 lg:h-12
              tv:w-16 tv:h-16
            " fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="
              w-8 h-8 text-white ml-1 drop-shadow-lg
              md:w-10 md:h-10 md:ml-1
              lg:w-12 lg:h-12 lg:ml-2
              tv:w-16 tv:h-16 tv:ml-3
            " fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
        </motion.button>

        {/* Station Selector - More square glassmorphic buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="
            flex gap-2 w-full mb-5
            max-w-xs
            md:gap-3 md:max-w-sm md:mb-6
            lg:max-w-md lg:gap-4
            tv:max-w-2xl tv:gap-6 tv:mb-8
          "
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
            tabIndex={0}
            className={`
              relative flex-1 rounded-xl font-semibold transition-all overflow-hidden tv-focusable
              py-3 px-3 text-xs
              md:py-4 md:px-4 md:text-sm
              lg:py-5 lg:px-5 lg:text-base
              tv:py-6 tv:px-8 tv:text-2xl
              ${currentStation.id === station.id ? 'text-white' : 'text-white/60'}
            `}
          >
            {/* Background */}
            <div className={`absolute inset-0 ${
              currentStation.id === station.id
                ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border-2 border-white/30'
                : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10'
            } rounded-xl transition-all`} />

            {/* Glow for active */}
            {currentStation.id === station.id && (
              <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-lg"
              />
            )}

            <span className="relative z-10">{station.id === 'fm' ? 'FM' : 'Folclor'}</span>
          </motion.button>
        ))}
        </motion.div>

        {/* Quality Selector - Glassmorphic buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="
            flex gap-2 w-full mb-5
            max-w-xs
            md:gap-3 md:max-w-sm md:mb-6
            lg:max-w-md lg:gap-4
            tv:max-w-2xl tv:gap-6 tv:mb-8
          "
        >
        {availableQualities.map((quality, index) => (
          <motion.button
            key={quality.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => switchQuality(quality.id)}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            tabIndex={0}
            className={`
              relative flex-1 rounded-lg font-medium transition-all overflow-hidden tv-focusable
              py-2 px-2 text-xs
              md:py-2.5 md:px-3 md:text-sm
              lg:py-3 lg:px-4 lg:text-base
              tv:py-4 tv:px-6 tv:text-xl
              ${selectedQuality === quality.id ? 'text-white' : 'text-white/50'}
            `}
          >
            {/* Background */}
            <div className={`absolute inset-0 ${
              selectedQuality === quality.id
                ? 'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30'
                : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10'
            } rounded-lg transition-all`} />

            {/* Glow for active */}
            {selectedQuality === quality.id && (
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur"
              />
            )}

            <span className="relative z-10">{quality.label}</span>
          </motion.button>
        ))}
        </motion.div>

        {/* Stream Quality Info - Text only */}
        {streamInfo && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="
              flex items-center justify-center gap-2 text-primary font-medium
              text-xs md:gap-3 md:text-sm
              lg:text-base lg:gap-4
              tv:text-xl tv:gap-6
            "
          >
            <span>{streamInfo.format}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full tv:w-2 tv:h-2" />
            <span>{streamInfo.bitrate}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full tv:w-2 tv:h-2" />
            <span>{streamInfo.channels}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full tv:w-2 tv:h-2" />
            <span>{streamInfo.sampleRate}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
