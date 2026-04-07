import { useContext, useMemo } from 'react';
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
  const isDesktopShell = !device?.isPortrait;
  const isSplitScreen = isDesktopShell && !forceCompactLayout;
  const viewportWidth = device?.screenWidth || 0;
  const viewportHeight = device?.screenHeight || 0;
  const aspectRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 1;
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
  const desktopMetaClass = `${textTertiaryClass} text-[11px] font-medium xl:text-[12px] 3xl:text-[13px]`;
  const desktopMetrics = useMemo(() => {
    const minViewport = Math.max(560, Math.min(viewportWidth || 1280, viewportHeight || 720));
    const profile = aspectRatio >= 1.9 ? 'ultrawide' : aspectRatio >= 1.25 ? 'wide' : 'square';
    const baseMetrics = {
      ultrawide: {
        coverSize: 430,
        playerWidth: 456,
        gap: 54,
        playButton: 74,
        titleWidth: 328,
        visualizerWidth: 162,
        visualizerHeight: 34,
        titleSize: 42,
        subtitleSize: 21,
        buttonRailWidth: 190,
      },
      wide: {
        coverSize: 396,
        playerWidth: 430,
        gap: 44,
        playButton: 70,
        titleWidth: 306,
        visualizerWidth: 148,
        visualizerHeight: 32,
        titleSize: 39,
        subtitleSize: 19,
        buttonRailWidth: 182,
      },
      square: {
        coverSize: 348,
        playerWidth: 392,
        gap: 32,
        playButton: 64,
        titleWidth: 284,
        visualizerWidth: 128,
        visualizerHeight: 28,
        titleSize: 32,
        subtitleSize: 17,
        buttonRailWidth: 170,
      }
    };

    const scale = Math.min(1.14, Math.max(0.68, minViewport / 940));
    const metrics = Object.fromEntries(
      Object.entries(baseMetrics[profile]).map(([key, value]) => [key, Math.round(value * scale)])
    );

    return {
      ...metrics,
      profile,
      stageWidth: metrics.coverSize + metrics.playerWidth + metrics.gap,
    };
  }, [aspectRatio, viewportHeight, viewportWidth]);
  const desktopTitleClass = '!leading-[0.96]';

  const renderCoverArt = (desktop = false) => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className={desktop
        ? 'relative shrink-0'
        : 'relative w-full mb-8 max-w-[360px] 4k:max-w-[600px] 4k:mb-12'}
      style={desktop ? { width: `${desktopMetrics.coverSize}px` } : undefined}
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
        <div className="mx-auto flex w-full items-center justify-center">
          <div
            className="flex items-center justify-center"
            style={{
              gap: `${desktopMetrics.gap}px`,
              width: `min(100%, ${desktopMetrics.stageWidth}px)`,
            }}
          >
            <div className="flex shrink-0 justify-start">
              {renderCoverArt(true)}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex shrink-0 flex-col items-end justify-center"
              style={{
                width: `${desktopMetrics.playerWidth}px`,
                minHeight: `${Math.round(desktopMetrics.coverSize * 0.72)}px`,
                maxHeight: `${desktopMetrics.coverSize}px`,
              }}
            >
              <div className="flex w-full flex-col items-end">
                <SpectrumVisualizer
                  analyserRef={audioAnalyserRef}
                  isPlaying={isPlaying}
                  className="mb-3 shrink-0"
                  style={{
                    width: `${desktopMetrics.visualizerWidth}px`,
                    height: `${desktopMetrics.visualizerHeight}px`,
                  }}
                />

                <div
                  className="ml-auto grid w-full items-center justify-end"
                  style={{
                    columnGap: `${Math.max(12, Math.round(desktopMetrics.playButton * 0.18))}px`,
                    gridTemplateColumns: `${desktopMetrics.playButton}px minmax(0, 1fr)`,
                  }}
                >
                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.05 }}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                    onClick={togglePlay}
                    disabled={isLoading}
                    tabIndex={0}
                    className="relative flex shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/12 text-white backdrop-blur-md transition-all hover:bg-white/18 disabled:opacity-40"
                    style={{
                      width: `${desktopMetrics.playButton}px`,
                      height: `${desktopMetrics.playButton}px`,
                    }}
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

                  <div className="flex min-w-0 flex-col items-end text-right" style={{ minWidth: 0, width: '100%' }}>
                    <Heading
                      level={2}
                      color="custom"
                      className={`mb-1 whitespace-nowrap text-right ${desktopTitleClass} ${textPrimaryClass}`}
                      style={{ fontSize: `${desktopMetrics.titleSize}px` }}
                    >
                      Radio Constanța
                    </Heading>
                    <Body
                      size="normal"
                      weight="medium"
                      opacity="custom"
                      className={`${textSecondaryClass} min-h-[1.5rem] whitespace-nowrap text-right`}
                      style={{ fontSize: `${desktopMetrics.subtitleSize}px`, lineHeight: 1.25 }}
                    >
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
                className="mt-5 flex justify-end gap-2"
                style={{ width: `${desktopMetrics.buttonRailWidth}px` }}
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
                      className={`relative min-w-0 flex-1 rounded-[12px] border px-4 py-3 text-[14px] font-semibold transition-all ${
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
