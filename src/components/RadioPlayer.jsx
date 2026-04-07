import { useContext } from 'react';
import { motion } from 'framer-motion';
import Loader from './Loader';
import SpectrumVisualizer from './SpectrumVisualizer';
import { ResponsiveContainer, Heading, Body, Caption } from './ui';
import { useWeatherTextColor } from '../hooks/useWeatherTextColor';
import { DeviceContext } from '../App';

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
    showWeatherBackground,
    audioAnalyserRef,
    forceCompactLayout,
  } = radioState;

  const device = useContext(DeviceContext);
  const isDesktopShell = (
    (device?.screenWidth || 0) >= 1180
    && (device?.screenHeight || 0) >= 760
    && !device?.isPortrait
  );
  const isSplitScreen = isDesktopShell && !forceCompactLayout;
  const weatherTextColor = useWeatherTextColor();

  const textColor = showWeatherBackground ? weatherTextColor : 'light';
  const textPrimaryClass = textColor === 'dark' ? 'text-gray-900' : 'text-text-primary';
  const textSecondaryClass = textColor === 'dark' ? 'text-gray-700' : 'text-text-secondary';
  const textTertiaryClass = textColor === 'dark' ? 'text-gray-600' : 'text-text-tertiary';
  const inactiveButtonClass = textColor === 'dark'
    ? 'bg-white/18 text-gray-900 border border-gray-900/12 hover:bg-white/26'
    : 'bg-bg-secondary/88 text-text-secondary border border-border hover:bg-bg-tertiary';
  const activeStationButtonClass = textColor === 'dark'
    ? 'border-gray-900/18 bg-transparent text-gray-900 shadow-none'
    : 'border-white/16 bg-transparent text-text-primary shadow-none';
  const desktopCoverClass = 'max-w-[clamp(21rem,28vw,31rem)] 3xl:max-w-[33rem] 4k:max-w-[36rem]';
  const desktopBlockHeightClass = 'max-h-[clamp(21rem,28vw,31rem)] 3xl:max-h-[33rem] 4k:max-h-[36rem]';
  const desktopMetaClass = `${textTertiaryClass} text-[12px] font-medium 3xl:text-[14px]`;

  const renderCoverArt = (desktop = false) => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className={desktop
        ? `relative w-full ${desktopCoverClass}`
        : 'relative w-full mb-8 max-w-[360px] 4k:max-w-[600px] 4k:mb-12'}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-[22px] border border-white/20 shadow-[0_18px_42px_rgba(15,20,25,0.14)] 3xl:rounded-[28px]">
        <motion.img
          key={currentStation.coverArt}
          src={currentStation.coverArt}
          alt={`${currentStation.name} cover art`}
          className="h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          whileHover={desktop ? { scale: 1.015 } : { scale: 1.02 }}
        />

        {isPlaying && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-xl bg-error/90 px-3 py-1.5 backdrop-blur-sm 3xl:right-6 3xl:top-6"
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-white"
              aria-hidden="true"
            />
            <Caption uppercase weight="semibold" className="text-[9px] text-white 3xl:text-[11px]">
              Live
            </Caption>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderMobileQualitySelector = () => (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-6 flex w-full max-w-xs gap-2 4k:mb-10 4k:max-w-md 4k:gap-3"
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
            onClick={() => switchQuality(currentStation.id, quality.id)}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 + index * 0.03 }}
            tabIndex={0}
            className={`relative flex-1 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all focusable 4k:rounded-xl 4k:px-5 4k:py-3 4k:text-[18px] ${
              isActive
                ? 'border-primary bg-bg-tertiary text-text-primary'
                : 'border-border bg-bg-secondary text-text-tertiary hover:bg-bg-tertiary'
            }`}
            aria-pressed={isActive}
            aria-label={`Switch to ${quality.label} quality`}
          >
            {quality.label}
          </motion.button>
        );
      })}
    </motion.div>
  );

  if (isSplitScreen) {
    return (
      <ResponsiveContainer section="radio" className="justify-center">
        <div className="grid w-full max-w-[1480px] grid-cols-[minmax(18rem,31rem)_minmax(5rem,1fr)_minmax(24rem,36rem)] items-center gap-8 3xl:gap-12 4k:gap-16">
          <div className="flex justify-start">
            {renderCoverArt(true)}
          </div>

          <div aria-hidden="true" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`flex w-full max-w-[36rem] flex-col items-end justify-center justify-self-end ${desktopBlockHeightClass}`}
          >
            <div className="flex w-full flex-col items-end">
              <SpectrumVisualizer
                analyserRef={audioAnalyserRef}
                isPlaying={isPlaying}
                className="mb-3 h-5 w-[3rem] 3xl:w-[3.5rem]"
              />

              <div className="flex w-full max-w-[32rem] items-center justify-end gap-4 3xl:max-w-[36rem] 3xl:gap-5">
                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  onClick={togglePlay}
                  disabled={isLoading}
                  tabIndex={0}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all disabled:opacity-40 3xl:h-24 3xl:w-24 4k:h-28 4k:w-28"
                  aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
                >
                  {isLoading ? (
                    <Loader size="small" />
                  ) : isPlaying ? (
                    <svg className="h-9 w-9 3xl:h-10 3xl:w-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="ml-1 h-9 w-9 3xl:h-10 3xl:w-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </motion.button>

                <div className="min-w-0 flex flex-1 flex-col items-end text-right">
                  <Heading level={2} color="custom" className={`mb-1 w-full text-right !text-4xl !leading-tight 3xl:!text-5xl ${textPrimaryClass}`}>
                    {currentStation.name}
                  </Heading>
                  <Body size="normal" weight="medium" opacity="custom" className={`${textSecondaryClass} min-h-[1.5rem] w-full text-right text-lg 3xl:text-xl`}>
                    {metadata || 'Primul radio din Dobrogea'}
                  </Body>
                </div>
              </div>
            </div>

            {streamInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`mt-4 flex flex-wrap items-center justify-end gap-2 text-right ${desktopMetaClass}`}
                role="status"
                aria-label="Stream information"
              >
                <span>{streamInfo.sampleRate}</span>
                <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-500' : 'bg-white/40'}`} aria-hidden="true" />
                <span>{streamInfo.channels}</span>
                <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-500' : 'bg-white/40'}`} aria-hidden="true" />
                <span>{streamInfo.bitrate}</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">{streamInfo.format}</span>
              </motion.div>
            )}

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5 flex w-full max-w-[11rem] justify-end gap-2 3xl:max-w-[13rem] 3xl:gap-3"
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
                    transition={{ delay: 0.24 + index * 0.05 }}
                    tabIndex={0}
                    className={`relative min-w-[5rem] flex-1 rounded-[12px] border px-4 py-3 text-[14px] font-semibold transition-all 3xl:min-w-[5.5rem] 3xl:px-5 3xl:py-3.5 3xl:text-[16px] ${
                      isActive
                        ? activeStationButtonClass
                        : inactiveButtonClass
                    }`}
                    aria-pressed={isActive}
                    aria-label={`Switch to ${station.id === 'fm' ? 'FM' : 'Folclor'} station`}
                  >
                    {station.id === 'fm' ? 'FM' : 'Folclor'}
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer section="radio">
      {renderCoverArt()}

      <div className="flex w-full flex-col items-center">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center 4k:mb-12"
        >
          <Heading level={3} color="custom" className={`mb-2 ${textPrimaryClass}`}>
            {currentStation.name}
          </Heading>
          {metadata && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Body size="normal" weight="medium" opacity="custom" className={textSecondaryClass}>
                {metadata}
              </Body>
            </motion.div>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.05 }}
          whileTap={{ scale: isLoading ? 1 : 0.95 }}
          onClick={togglePlay}
          disabled={isLoading}
          tabIndex={0}
          className="group focusable relative mb-8 h-20 w-20 rounded-full bg-primary transition-all disabled:opacity-40 4k:mb-12 4k:h-32 4k:w-32"
          aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
        >
          <div className="flex h-full w-full items-center justify-center">
            {isLoading ? (
              <Loader size="small" />
            ) : isPlaying ? (
              <svg className="h-9 w-9 text-white 4k:h-14 4k:w-14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="ml-1 h-9 w-9 text-white 4k:h-14 4k:w-14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </motion.button>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-5 flex w-full max-w-xs gap-2 4k:mb-8 4k:max-w-md 4k:gap-3"
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
                className={`relative flex-1 rounded-[10px] border px-4 py-3 text-[14px] font-semibold transition-all focusable 4k:rounded-[14px] 4k:px-6 4k:py-5 4k:text-[20px] ${
                  isActive
                    ? 'border-primary/40 bg-transparent text-primary hover:bg-primary/5'
                    : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
                aria-pressed={isActive}
                aria-label={`Switch to ${station.id === 'fm' ? 'FM' : 'Folclor'} station`}
              >
                {station.id === 'fm' ? 'FM' : 'Folclor'}
              </motion.button>
            );
          })}
        </motion.div>

        {renderMobileQualitySelector()}

        {streamInfo && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`flex items-center justify-center gap-2 text-[12px] font-medium 4k:gap-3 4k:text-[18px] ${textTertiaryClass}`}
            role="status"
            aria-label="Stream information"
          >
            <span>{streamInfo.format}</span>
            <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-400' : 'bg-border'}`} aria-hidden="true" />
            <span>{streamInfo.bitrate}</span>
            <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-400' : 'bg-border'}`} aria-hidden="true" />
            <span>{streamInfo.channels}</span>
            <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-400' : 'bg-border'}`} aria-hidden="true" />
            <span>{streamInfo.sampleRate}</span>
          </motion.div>
        )}
      </div>
    </ResponsiveContainer>
  );
}
