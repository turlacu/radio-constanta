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
    shortHeightLayout,
    layoutMode,
  } = radioState;

  const device = useContext(DeviceContext);
  const isDesktopShell = device?.showDesktopShell;
  const isSplitScreen = isDesktopShell && !forceCompactLayout;
  const viewportWidth = device?.viewportWidth || device?.screenWidth || 0;
  const viewportHeight = device?.viewportHeight || device?.screenHeight || 0;
  const aspectRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 1;
  const weatherTextColor = useWeatherTextColor();

  const textColor = showWeatherBackground ? weatherTextColor : 'light';
  const buttonBorderColor =
    textColor === 'dark' ? 'rgba(17, 24, 39, 0.18)' : 'rgba(255, 255, 255, 0.18)';
  const strongButtonBorderColor =
    textColor === 'dark' ? 'rgba(17, 24, 39, 0.28)' : 'rgba(255, 255, 255, 0.24)';
  const textPrimaryClass = textColor === 'dark' ? 'text-gray-900' : 'text-text-primary';
  const textSecondaryClass = textColor === 'dark' ? 'text-gray-700' : 'text-text-secondary';
  const textTertiaryClass = textColor === 'dark' ? 'text-gray-600' : 'text-text-tertiary';
  const coverBorderClass = textColor === 'dark' ? 'border-gray-900/18' : 'border-white/20';
  const desktopAccentBorderClass = textColor === 'dark' ? 'border-gray-900/18' : 'border-white/18';
  const desktopAccentSurfaceClass = textColor === 'dark' ? 'bg-gray-900/10 hover:bg-gray-900/16' : 'bg-white/12 hover:bg-white/18';
  const desktopButtonTextClass = textColor === 'dark' ? 'text-gray-900' : 'text-white';
  const inactiveButtonClass = textColor === 'dark'
    ? 'bg-gray-900/10 text-gray-900 border border-gray-900/18 hover:bg-gray-900/16'
    : 'bg-white/10 text-white/80 border border-white/18 hover:bg-white/16';
  const activeStationButtonClass = textColor === 'dark'
    ? 'border-gray-900/28 bg-transparent text-gray-900 shadow-none'
    : 'border-white/24 bg-transparent text-white shadow-none';
  const activeMobileQualityClass = textColor === 'dark'
    ? 'border-gray-900/28 bg-gray-900/10 text-gray-900 hover:bg-gray-900/16'
    : 'border-white/24 bg-white/10 text-white hover:bg-white/16';
  const inactiveMobileQualityClass = textColor === 'dark'
    ? 'border-gray-900/18 bg-gray-900/6 text-gray-700 hover:bg-gray-900/12'
    : 'border-white/18 bg-white/6 text-white/70 hover:bg-white/12';
  const activeMobileStationClass = textColor === 'dark'
    ? 'border-gray-900/28 bg-transparent text-gray-900 hover:bg-gray-900/5'
    : 'border-white/24 bg-transparent text-white hover:bg-white/8';
  const inactiveMobileStationClass = textColor === 'dark'
    ? 'border-gray-900/18 bg-gray-900/6 text-gray-700 hover:bg-gray-900/12'
    : 'border-white/18 bg-white/6 text-white/70 hover:bg-white/12';
  const desktopMetaClass = `${textTertiaryClass} text-[11px] font-medium xl:text-[12px] 3xl:text-[13px]`;
  const streamFormatBadgeClass = textColor === 'dark'
    ? 'border-gray-900/30 bg-gray-900 text-white'
    : 'border-white/28 bg-white text-gray-950';
  const streamBadgeBaseClass = 'inline-flex items-center justify-center rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[0.02em] xl:text-[12px]';
  const stationButtonBaseClass = 'relative flex-1 min-w-0 overflow-hidden border py-3 font-semibold leading-none transition-all';
  const desktopStationButtonClass = 'rounded-[12px] px-3 text-[13px] xl:px-4 xl:text-[14px]';
  const mobileStationButtonClass = 'rounded-[10px] px-3 text-[13px] sm:px-4 sm:text-[14px] 4k:rounded-[14px] 4k:px-6 4k:py-5 4k:text-[20px]';
  const stationLabelBaseClass = 'block w-full overflow-hidden text-center leading-none';
  const qualityButtonBaseClass = 'relative flex-1 overflow-hidden rounded-[10px] border px-3 py-2 text-[12px] font-medium leading-none transition-all focusable sm:text-[13px] 4k:rounded-xl 4k:px-5 4k:py-3 4k:text-[18px]';
  const isUltraWideShort = layoutMode === 'car-shell' || (aspectRatio >= 3 && viewportHeight <= 560);
  const shouldStackDesktopStage = !isUltraWideShort && (viewportWidth < 1320 || viewportHeight < 760);
  const desktopMetrics = useMemo(() => {
    const minViewport = Math.max(560, Math.min(viewportWidth || 1280, viewportHeight || 720));
    const profile = isUltraWideShort ? 'car' : shouldStackDesktopStage ? 'compact' : aspectRatio >= 1.9 ? 'ultrawide' : aspectRatio >= 1.25 ? 'wide' : 'square';
    const baseMetrics = {
      car: {
        coverSize: 236,
        playerWidth: 760,
        gap: 54,
        playButton: 60,
        titleWidth: 560,
        visualizerWidth: 118,
        visualizerHeight: 22,
        titleSize: 30,
        subtitleSize: 14,
        buttonRailWidth: 320,
      },
      compact: {
        coverSize: 314,
        playerWidth: 520,
        gap: 28,
        playButton: 62,
        titleWidth: 420,
        visualizerWidth: 132,
        visualizerHeight: 26,
        titleSize: 34,
        subtitleSize: 17,
        buttonRailWidth: 272,
      },
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
  }, [aspectRatio, isUltraWideShort, shouldStackDesktopStage, viewportHeight, viewportWidth]);
  const desktopTitleClass = '!leading-[0.96]';

  const renderCoverArt = (desktop = false) => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className={desktop
        ? 'relative shrink-0'
        : 'relative w-full mb-8 max-w-[360px] 4k:max-w-[600px] 4k:mb-12'}
      style={desktop ? { width: `${desktopMetrics.coverSize}px`, maxWidth: isUltraWideShort ? '32vh' : undefined } : undefined}
    >
      <div className={`relative w-full aspect-square overflow-hidden rounded-[22px] border shadow-[0_18px_42px_rgba(15,20,25,0.14)] 3xl:rounded-[28px] ${coverBorderClass}`}>
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
              className={`absolute right-4 top-4 flex items-center gap-1.5 rounded-xl border bg-error/95 px-3 py-1.5 text-white backdrop-blur-sm 3xl:right-6 3xl:top-6 ${textColor === 'dark' ? 'border-gray-900/18' : 'border-white/20'}`}
              style={{ borderColor: textColor === 'dark' ? 'rgba(17, 24, 39, 0.18)' : 'rgba(255, 255, 255, 0.20)' }}
            >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-white"
              aria-hidden="true"
            />
            <Caption uppercase weight="semibold" className="text-[11px] text-white 3xl:text-[12px]">
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
          className={`mb-6 flex w-full gap-2 4k:mb-10 4k:gap-3 ${shortHeightLayout ? 'max-w-sm' : 'max-w-xs 4k:max-w-md'}`}
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
                          className={`${qualityButtonBaseClass} ${
                            isActive
                              ? activeMobileQualityClass
                              : inactiveMobileQualityClass
                          }`}
                          style={{ borderColor: isActive ? strongButtonBorderColor : buttonBorderColor }}
                          aria-pressed={isActive}
                          aria-label={`Switch to ${quality.label} quality`}
                        >
            <span className={stationLabelBaseClass}>{quality.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );

  if (isSplitScreen) {
    return (
      <ResponsiveContainer section="radio" className="justify-center">
        <div className={`mx-auto flex w-full items-center ${isUltraWideShort ? 'max-w-[1480px] justify-between' : 'max-w-[1160px] justify-center 4k:max-w-[1320px]'}`}>
          <div
            className={`flex w-full items-center ${isUltraWideShort ? 'justify-between' : 'justify-center'} ${shouldStackDesktopStage ? 'flex-col gap-8' : ''}`}
            style={{
              gap: `${desktopMetrics.gap}px`,
              maxWidth: isUltraWideShort ? 'min(100%, 1440px)' : shouldStackDesktopStage ? 'min(100%, 980px)' : `${desktopMetrics.stageWidth}px`,
            }}
          >
            <div className={`flex justify-start ${shouldStackDesktopStage ? 'w-full justify-center' : 'shrink-0'} ${isUltraWideShort ? 'pl-4' : ''}`}>
              {renderCoverArt(true)}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`relative flex flex-col justify-center ${shouldStackDesktopStage ? 'w-full max-w-[640px] items-center' : 'shrink-0 items-end'} ${isUltraWideShort ? 'flex-1 py-2 pr-4' : ''}`}
              style={{
                width: isUltraWideShort ? 'min(100%, 860px)' : shouldStackDesktopStage ? 'min(100%, 640px)' : `${desktopMetrics.playerWidth}px`,
                minHeight: shouldStackDesktopStage ? undefined : `${desktopMetrics.coverSize}px`,
              }}
            >
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={togglePlay}
                disabled={isLoading}
                tabIndex={0}
                className={`${shouldStackDesktopStage ? 'relative mb-6' : 'absolute left-0'} flex shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all disabled:opacity-40 ${desktopAccentBorderClass} ${desktopAccentSurfaceClass} ${desktopButtonTextClass}`}
                style={{
                  width: `${desktopMetrics.playButton}px`,
                  height: `${desktopMetrics.playButton}px`,
                  top: shouldStackDesktopStage ? undefined : `${Math.round((desktopMetrics.coverSize - desktopMetrics.playButton) / 2)}px`,
                  borderColor: buttonBorderColor,
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

              <div
                className={`flex w-full flex-col justify-center ${shouldStackDesktopStage ? 'items-center text-center' : 'items-end'}`}
                style={{
                  rowGap: `${Math.max(12, Math.round(desktopMetrics.playButton * 0.18))}px`,
                }}
              >
                <SpectrumVisualizer
                  analyserRef={audioAnalyserRef}
                  isPlaying={isPlaying}
                  tone={textColor}
                  className={`shrink-0 ${shouldStackDesktopStage ? 'mx-auto' : ''}`}
                  style={{
                    width: `${desktopMetrics.visualizerWidth}px`,
                    height: `${desktopMetrics.visualizerHeight}px`,
                  }}
                />

                <div
                  className={`grid w-full items-center ${shouldStackDesktopStage ? 'justify-center' : 'ml-auto justify-end'}`}
                  style={{
                    columnGap: `${Math.max(12, Math.round(desktopMetrics.playButton * 0.18))}px`,
                    gridTemplateColumns: shouldStackDesktopStage ? 'minmax(0, 1fr)' : `${desktopMetrics.playButton}px minmax(0, 1fr)`,
                  }}
                >
                  {!shouldStackDesktopStage && <div aria-hidden="true" />}

                  <div className={`flex min-w-0 flex-col ${shouldStackDesktopStage ? 'items-center text-center' : 'items-end text-right'}`} style={{ minWidth: 0, width: '100%' }}>
                    <Heading
                      level={2}
                      color="custom"
                      className={`mb-1 max-w-full text-balance ${shouldStackDesktopStage ? 'text-center' : 'text-right'} ${desktopTitleClass} ${textPrimaryClass}`}
                      style={{ fontSize: `${desktopMetrics.titleSize}px` }}
                    >
                      Radio Constanța
                    </Heading>
                    <Body
                      size="normal"
                      weight="medium"
                      opacity="custom"
                      className={`${textSecondaryClass} max-w-full text-pretty ${shouldStackDesktopStage ? 'text-center' : 'text-right'}`}
                      style={{ fontSize: `${desktopMetrics.subtitleSize}px`, lineHeight: 1.25 }}
                    >
                      {metadata || 'Primul radio din Dobrogea'}
                    </Body>
                  </div>
                </div>

                {streamInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`flex flex-wrap items-center gap-2 ${shouldStackDesktopStage ? 'justify-center text-center' : 'justify-end text-right'} ${desktopMetaClass}`}
                    role="status"
                    aria-label="Stream information"
                  >
                    <span>{streamInfo.sampleRate}</span>
                    <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-500' : 'bg-white/40'}`} aria-hidden="true" />
                    <span>{streamInfo.channels}</span>
                    <span className={`h-1 w-1 rounded-full ${textColor === 'dark' ? 'bg-gray-500' : 'bg-white/40'}`} aria-hidden="true" />
                    <span>{streamInfo.bitrate}</span>
                    <span className={`${streamBadgeBaseClass} ${streamFormatBadgeClass}`}>
                      {streamInfo.format}
                    </span>
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`flex gap-2 ${shouldStackDesktopStage ? 'w-full max-w-[320px] justify-center' : 'justify-end'}`}
                  style={{ width: shouldStackDesktopStage ? '100%' : `${desktopMetrics.buttonRailWidth}px` }}
                  role="group"
                  aria-label="Station selection"
                >
                  {stations.map((station, index) => {
                    const isActive = currentStation.id === station.id;
                    const stationLabel = station.id === 'fm' ? 'FM' : 'Folclor';
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
                        className={`${stationButtonBaseClass} ${desktopStationButtonClass} ${
                          isActive
                            ? activeStationButtonClass
                            : inactiveButtonClass
                        }`}
                        style={{ borderColor: isActive ? strongButtonBorderColor : buttonBorderColor }}
                        aria-pressed={isActive}
                        aria-label={`Switch to ${stationLabel} station`}
                      >
                        <span
                          className={`${stationLabelBaseClass} ${
                            station.id === 'fm' ? 'whitespace-nowrap' : 'text-[12px] tracking-[0.01em] xl:text-[13px]'
                          }`}
                        >
                          {stationLabel}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>
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
            const stationLabel = station.id === 'fm' ? 'FM' : 'Folclor';
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
                    className={`${stationButtonBaseClass} ${mobileStationButtonClass} focusable ${
                      isActive
                        ? activeMobileStationClass
                        : inactiveMobileStationClass
                    }`}
                    style={{ borderColor: isActive ? strongButtonBorderColor : buttonBorderColor }}
                    aria-pressed={isActive}
                    aria-label={`Switch to ${stationLabel} station`}
                  >
                <span
                  className={`${stationLabelBaseClass} ${
                    station.id === 'fm' ? 'whitespace-nowrap' : 'text-[12px] tracking-[0.01em] sm:text-[13px] 4k:text-[18px]'
                  }`}
                >
                  {stationLabel}
                </span>
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
            <span className={`${streamBadgeBaseClass} ${streamFormatBadgeClass}`}>
              {streamInfo.format}
            </span>
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
