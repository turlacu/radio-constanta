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
    shortHeightLayout,
    layoutMode,
  } = radioState;

  const device = useContext(DeviceContext);
  const isDesktopShell = device?.showDesktopShell;
  const isSplitScreen = isDesktopShell && !forceCompactLayout;
  const viewportWidth = device?.viewportWidth || device?.screenWidth || 0;
  const viewportHeight = device?.viewportHeight || device?.screenHeight || 0;
  const aspectRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 1;
  const useCenteredDesktopStack = isDesktopShell && (device?.isUltraWide || aspectRatio <= 1.5);
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
  const desktopMetaClass = `${textTertiaryClass} text-[clamp(0.72rem,0.68rem+0.12vw,0.82rem)] font-medium`;
  const streamFormatBadgeClass = textColor === 'dark'
    ? 'border-gray-900/30 bg-gray-900 text-white'
    : 'border-white/28 bg-white text-gray-950';
  const streamBadgeBaseClass = 'inline-flex items-center justify-center rounded-[10px] border px-[clamp(0.55rem,0.5rem+0.18vw,0.7rem)] py-[clamp(0.22rem,0.18rem+0.08vw,0.32rem)] text-[clamp(0.7rem,0.66rem+0.12vw,0.8rem)] font-semibold leading-none tracking-[0.02em]';
  const stationButtonBaseClass = 'relative flex-1 min-w-0 overflow-hidden border py-[clamp(0.65rem,0.58rem+0.22vw,0.9rem)] font-semibold leading-none transition-all';
  const desktopStationButtonClass = 'rounded-[12px] px-[clamp(0.75rem,0.68rem+0.22vw,1rem)] text-[clamp(0.76rem,0.72rem+0.14vw,0.9rem)]';
  const mobileStationButtonClass = 'rounded-[10px] px-[clamp(0.8rem,0.72rem+0.25vw,1.15rem)] text-[clamp(0.78rem,0.72rem+0.2vw,0.98rem)]';
  const stationLabelBaseClass = 'block w-full overflow-hidden text-center leading-none';
  const qualityButtonBaseClass = 'relative flex-1 overflow-hidden rounded-[10px] border px-[clamp(0.75rem,0.68rem+0.22vw,1rem)] py-[clamp(0.55rem,0.5rem+0.16vw,0.75rem)] text-[clamp(0.76rem,0.72rem+0.16vw,0.92rem)] font-medium leading-none transition-all focusable';
  const isUltraWideShort = layoutMode === 'car-shell' || (aspectRatio >= 3 && viewportHeight <= 560);
  const desktopTitleClass = '!leading-[0.96]';
  const desktopCoverWidth = isUltraWideShort
    ? 'clamp(180px, 23vh, 260px)'
    : 'clamp(260px, 30vw, 430px)';
  const desktopPlayButtonSize = isUltraWideShort
    ? 'clamp(54px, 6vh, 64px)'
    : 'clamp(58px, 5vw, 76px)';
  const desktopVisualizerWidth = isUltraWideShort
    ? 'clamp(100px, 14vw, 132px)'
    : 'clamp(120px, 16vw, 168px)';
  const desktopVisualizerHeight = isUltraWideShort
    ? 'clamp(18px, 2.6vh, 24px)'
    : 'clamp(24px, 3vw, 34px)';
  const desktopTitleSize = isUltraWideShort
    ? 'clamp(1.8rem, 3vw, 2.2rem)'
    : 'clamp(2rem, 3.2vw, 2.9rem)';
  const desktopSubtitleSize = isUltraWideShort
    ? 'clamp(0.95rem, 1.5vw, 1.05rem)'
    : 'clamp(1rem, 1.7vw, 1.35rem)';
  const desktopStationRailWidth = isUltraWideShort
    ? 'min(100%, 22rem)'
    : 'min(100%, 20rem)';
  const desktopStageLayoutClass = isUltraWideShort
    ? 'flex flex-row items-center justify-between gap-[clamp(1.25rem,1rem+0.8vw,2rem)]'
    : 'grid items-center gap-[clamp(1.5rem,1.2rem+1vw,2.5rem)] min-[1320px]:grid-cols-[minmax(280px,38%)_minmax(360px,1fr)]';
  const desktopStageInnerClass = isUltraWideShort
    ? 'flex-1 min-w-0'
    : 'w-full max-w-[42rem] justify-self-center min-[1320px]:justify-self-end';

  const renderCoverArt = (desktop = false) => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className={desktop
        ? 'relative shrink-0'
        : 'relative mb-[clamp(1.75rem,1.4rem+1.2vw,3rem)] w-full max-w-[clamp(18rem,72vw,32rem)]'}
      style={desktop ? { width: desktopCoverWidth } : undefined}
    >
      <div className={`relative w-full aspect-square overflow-hidden rounded-[clamp(1.125rem,0.95rem+0.7vw,1.75rem)] border shadow-[0_18px_42px_rgba(15,20,25,0.14)] ${coverBorderClass}`}>
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
              className={`absolute right-[clamp(0.9rem,0.8rem+0.35vw,1.5rem)] top-[clamp(0.9rem,0.8rem+0.35vw,1.5rem)] flex items-center gap-1.5 rounded-xl border bg-error/95 px-[clamp(0.65rem,0.55rem+0.3vw,0.95rem)] py-[clamp(0.3rem,0.24rem+0.18vw,0.5rem)] text-white backdrop-blur-sm ${textColor === 'dark' ? 'border-gray-900/18' : 'border-white/20'}`}
              style={{ borderColor: textColor === 'dark' ? 'rgba(17, 24, 39, 0.18)' : 'rgba(255, 255, 255, 0.20)' }}
            >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-white"
              aria-hidden="true"
            />
            <Caption uppercase weight="semibold" className="text-[clamp(0.68rem,0.65rem+0.08vw,0.78rem)] text-white">
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
          className={`mb-[clamp(1.25rem,1rem+0.8vw,2.25rem)] flex w-full gap-[clamp(0.5rem,0.42rem+0.22vw,0.75rem)] ${shortHeightLayout ? 'max-w-[min(100%,24rem)]' : 'max-w-[min(100%,20rem)]'}`}
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
    if (useCenteredDesktopStack) {
      return (
        <ResponsiveContainer section="radio" className="justify-center">
          <div className="mx-auto flex w-full max-w-[min(100%,56rem)] flex-col items-center text-center">
            {renderCoverArt(true)}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-[clamp(1.25rem,1rem+0.8vw,2rem)] flex w-full flex-col items-center gap-[clamp(0.9rem,0.72rem+0.55vw,1.5rem)]"
            >
              <SpectrumVisualizer
                analyserRef={audioAnalyserRef}
                isPlaying={isPlaying}
                tone={textColor}
                className="shrink-0"
                style={{
                  width: desktopVisualizerWidth,
                  height: desktopVisualizerHeight,
                }}
              />

              <div className="flex w-full max-w-[min(100%,36rem)] flex-col items-center text-center">
                <Heading
                  level={2}
                  color="custom"
                  className={`mb-[clamp(0.2rem,0.16rem+0.1vw,0.35rem)] max-w-full text-balance text-center ${desktopTitleClass} ${textPrimaryClass}`}
                  style={{ fontSize: desktopTitleSize }}
                >
                  Radio Constanța
                </Heading>
                <Body
                  size="normal"
                  weight="medium"
                  opacity="custom"
                  className={`${textSecondaryClass} max-w-full text-pretty text-center`}
                  style={{ fontSize: desktopSubtitleSize, lineHeight: 1.25 }}
                >
                  {metadata || 'Primul radio din Dobrogea'}
                </Body>
              </div>

              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={togglePlay}
                disabled={isLoading}
                tabIndex={0}
                className={`flex shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all disabled:opacity-40 ${desktopAccentBorderClass} ${desktopAccentSurfaceClass} ${desktopButtonTextClass}`}
                style={{
                  width: desktopPlayButtonSize,
                  height: desktopPlayButtonSize,
                  borderColor: buttonBorderColor,
                }}
                aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
              >
                {isLoading ? (
                  <Loader size="small" />
                ) : isPlaying ? (
                  <svg className="h-[clamp(2rem,1.8rem+0.45vw,2.5rem)] w-[clamp(2rem,1.8rem+0.45vw,2.5rem)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="ml-[clamp(0.12rem,0.08rem+0.08vw,0.2rem)] h-[clamp(2rem,1.8rem+0.45vw,2.5rem)] w-[clamp(2rem,1.8rem+0.45vw,2.5rem)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.button>

              {streamInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`flex flex-wrap items-center justify-center gap-2 text-center ${desktopMetaClass}`}
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
                className="flex w-full justify-center gap-2"
                style={{ maxWidth: desktopStationRailWidth }}
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
                        isActive ? activeStationButtonClass : inactiveButtonClass
                      }`}
                      style={{ borderColor: isActive ? strongButtonBorderColor : buttonBorderColor }}
                      aria-pressed={isActive}
                      aria-label={`Switch to ${stationLabel} station`}
                    >
                      <span
                        className={`${stationLabelBaseClass} ${
                          station.id === 'fm' ? 'whitespace-nowrap' : 'text-[clamp(0.72rem,0.68rem+0.12vw,0.82rem)] tracking-[0.01em]'
                        }`}
                      >
                        {stationLabel}
                      </span>
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
      <ResponsiveContainer section="radio" className="justify-center">
        <div className={`mx-auto w-full ${isUltraWideShort ? 'max-w-[min(100%,92rem)]' : 'max-w-[min(100%,85rem)]'}`}>
          <div className={desktopStageLayoutClass}>
            <div className={`flex ${isUltraWideShort ? 'justify-start pl-4' : 'w-full justify-center min-[1320px]:justify-start'}`}>
              {renderCoverArt(true)}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`flex flex-col justify-center ${desktopStageInnerClass} ${isUltraWideShort ? 'py-2 pr-4' : ''}`}
            >
              <div
                className={`flex w-full flex-col gap-5 ${isUltraWideShort ? 'items-start text-left' : 'items-center text-center min-[1320px]:items-end min-[1320px]:text-right'}`}
              >
                <SpectrumVisualizer
                  analyserRef={audioAnalyserRef}
                  isPlaying={isPlaying}
                  tone={textColor}
                  className={`shrink-0 ${isUltraWideShort ? '' : 'mx-auto min-[1320px]:mx-0'}`}
                  style={{
                    width: desktopVisualizerWidth,
                    height: desktopVisualizerHeight,
                  }}
                />

                <div className={`grid w-full items-center gap-4 ${isUltraWideShort ? 'grid-cols-[auto_minmax(0,1fr)]' : 'max-w-[42rem] grid-cols-[auto_minmax(0,1fr)] min-[1320px]:ml-auto'}`}>
                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.05 }}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                    onClick={togglePlay}
                    disabled={isLoading}
                    tabIndex={0}
                    className={`flex shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all disabled:opacity-40 ${desktopAccentBorderClass} ${desktopAccentSurfaceClass} ${desktopButtonTextClass}`}
                    style={{
                      width: desktopPlayButtonSize,
                      height: desktopPlayButtonSize,
                      borderColor: buttonBorderColor,
                    }}
                    aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
                  >
                    {isLoading ? (
                      <Loader size="small" />
                    ) : isPlaying ? (
                      <svg className="h-[clamp(2rem,1.8rem+0.45vw,2.5rem)] w-[clamp(2rem,1.8rem+0.45vw,2.5rem)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="ml-[clamp(0.12rem,0.08rem+0.08vw,0.2rem)] h-[clamp(2rem,1.8rem+0.45vw,2.5rem)] w-[clamp(2rem,1.8rem+0.45vw,2.5rem)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </motion.button>

                  <div className={`flex min-w-0 flex-col ${isUltraWideShort ? 'items-start text-left' : 'items-start text-left min-[1320px]:items-end min-[1320px]:text-right'}`} style={{ minWidth: 0, width: '100%' }}>
                    <Heading
                      level={2}
                      color="custom"
                      className={`mb-1 max-w-full text-balance ${isUltraWideShort ? 'text-left' : 'text-left min-[1320px]:text-right'} ${desktopTitleClass} ${textPrimaryClass}`}
                      style={{ fontSize: desktopTitleSize }}
                    >
                      Radio Constanța
                    </Heading>
                    <Body
                      size="normal"
                      weight="medium"
                      opacity="custom"
                      className={`${textSecondaryClass} max-w-full text-pretty ${isUltraWideShort ? 'text-left' : 'text-left min-[1320px]:text-right'}`}
                      style={{ fontSize: desktopSubtitleSize, lineHeight: 1.25 }}
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
                    className={`flex flex-wrap items-center gap-2 ${isUltraWideShort ? 'justify-start text-left' : 'justify-center text-center min-[1320px]:justify-end min-[1320px]:text-right'} ${desktopMetaClass}`}
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
                  className={`flex w-full gap-2 ${isUltraWideShort ? 'justify-start' : 'justify-center min-[1320px]:justify-end'}`}
                  style={{ maxWidth: desktopStationRailWidth }}
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
                            station.id === 'fm' ? 'whitespace-nowrap' : 'text-[clamp(0.72rem,0.68rem+0.12vw,0.82rem)] tracking-[0.01em]'
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
          className="mb-[clamp(1.75rem,1.35rem+1.2vw,3rem)] text-center"
        >
          <Heading level={3} color="custom" className={`mb-2 max-w-full text-center ${textPrimaryClass}`}>
            {currentStation.name}
          </Heading>
          {metadata && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Body size="normal" weight="medium" opacity="custom" className={`max-w-full text-center ${textSecondaryClass}`}>
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
          className="group focusable relative mb-[clamp(1.75rem,1.35rem+1.2vw,3rem)] h-[clamp(4.5rem,3.9rem+1.8vw,7rem)] w-[clamp(4.5rem,3.9rem+1.8vw,7rem)] rounded-full bg-primary transition-all disabled:opacity-40"
          aria-label={isPlaying ? 'Pause radio stream' : 'Play radio stream'}
        >
          <div className="flex h-full w-full items-center justify-center">
            {isLoading ? (
              <Loader size="small" />
            ) : isPlaying ? (
              <svg className="h-[clamp(2rem,1.7rem+1vw,3.5rem)] w-[clamp(2rem,1.7rem+1vw,3.5rem)] text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="ml-[clamp(0.12rem,0.08rem+0.08vw,0.2rem)] h-[clamp(2rem,1.7rem+1vw,3.5rem)] w-[clamp(2rem,1.7rem+1vw,3.5rem)] text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </motion.button>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-[clamp(1rem,0.82rem+0.65vw,2rem)] flex w-full max-w-[min(100%,20rem)] gap-[clamp(0.5rem,0.42rem+0.22vw,0.75rem)]"
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
                    station.id === 'fm' ? 'whitespace-nowrap' : 'text-[clamp(0.72rem,0.68rem+0.16vw,0.95rem)] tracking-[0.01em]'
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
            className={`flex items-center justify-center gap-2 text-[clamp(0.76rem,0.72rem+0.18vw,0.98rem)] font-medium ${textTertiaryClass}`}
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
