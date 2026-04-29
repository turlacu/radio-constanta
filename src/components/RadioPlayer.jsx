import { useContext, useEffect, useRef, useState } from 'react';
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
    nowPlaying,
    nowPlayingEnabled,
    nowPlayingOverride,
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
    availablePaneAspectRatio,
  } = radioState;

  const device = useContext(DeviceContext);
  const isDesktopShell = device?.policy?.isDesktopShell;
  const viewportWidth = device?.viewportWidth || device?.screenWidth || 0;
  const viewportHeight = device?.viewportHeight || device?.screenHeight || 0;
  const aspectRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 1;
  const effectivePaneAspectRatio = availablePaneAspectRatio || aspectRatio;
  const useCompactDesktopSizing = isDesktopShell && (forceCompactLayout || shortHeightLayout);
  const useCenteredDesktopStack = isDesktopShell && (forceCompactLayout || effectivePaneAspectRatio < 1.25);
  const useCompactStackedSizing = !isDesktopShell && (shortHeightLayout || aspectRatio > 0.72);
  const mobileCoverMaxPx = useCompactStackedSizing
    ? Math.min(viewportWidth * 0.62, viewportHeight * 0.34)
    : Math.min(viewportWidth * 0.72, viewportHeight * 0.42);
  const mobileCoverWidth = Math.max(188, Math.min(mobileCoverMaxPx || 0, 360));
  const weatherTextColor = useWeatherTextColor();
  const coverMedia = currentStation.coverMedia || { type: 'image', coverPath: currentStation.coverArt };
  const isVideoCover = coverMedia.type === 'video' && coverMedia.videoUrl;
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const currentSubtitle = nowPlayingEnabled && nowPlayingOverride?.text
    ? nowPlayingOverride.text
    : nowPlayingEnabled && nowPlaying?.text
    ? nowPlaying.text
    : metadata || 'Primul radio din Dobrogea';

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
  const desktopTitleClass = '!leading-[0.96]';
  const desktopCoverWidth = useCompactDesktopSizing
    ? 'min(100%, clamp(15rem, 33vh, 20.5rem))'
    : 'clamp(16rem, 28vw, 26rem)';
  const desktopVideoCoverWidth = useCompactDesktopSizing
    ? 'min(100%, clamp(24rem, 58vh, 36rem))'
    : 'min(100%, clamp(28rem, 50vw, 46rem))';
  const desktopPlayButtonSize = useCompactDesktopSizing
    ? 'clamp(3.6rem, 5.7vh, 4.6rem)'
    : 'clamp(3.75rem, 4.6vw, 5rem)';
  const desktopVisualizerWidth = useCompactDesktopSizing
    ? 'clamp(7rem, 12vw, 9rem)'
    : 'clamp(7rem, 14vw, 10rem)';
  const desktopVisualizerHeight = useCompactDesktopSizing
    ? 'clamp(1.05rem, 1.95vh, 1.4rem)'
    : 'clamp(1.25rem, 2.6vw, 2rem)';
  const desktopTitleSize = useCompactDesktopSizing
    ? 'clamp(1.8rem, 2.3vw, 2.35rem)'
    : 'clamp(2rem, 2.8vw, 2.8rem)';
  const desktopSubtitleSize = useCompactDesktopSizing
    ? 'clamp(0.98rem, 1.15vw, 1.12rem)'
    : 'clamp(1rem, 1.4vw, 1.28rem)';
  const desktopStationRailWidth = useCompactDesktopSizing
    ? 'min(100%, 23rem)'
    : 'min(100%, 24rem)';
  const hasExpandedVideoCover = isVideoCover && !videoFailed;
  const mobileVideoCoverWidth = Math.max(
    mobileCoverWidth,
    Math.min(
      Math.max(0, viewportWidth - 32),
      mobileCoverWidth * 1.78
    )
  );

  useEffect(() => {
    setVideoFailed(false);
  }, [coverMedia.type, coverMedia.videoUrl]);

  useEffect(() => {
    if (!isVideoCover || videoFailed || !videoRef.current) {
      return undefined;
    }

    const video = videoRef.current;
    let hls = null;
    let cancelled = false;

    video.muted = coverMedia.muted !== false;
    video.playsInline = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = coverMedia.videoUrl;
      video.play().catch(() => {});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) {
          return;
        }

        if (!Hls.isSupported()) {
          setVideoFailed(true);
          return;
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(coverMedia.videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data?.fatal) {
            setVideoFailed(true);
          }
        });
      }).catch(() => {
        setVideoFailed(true);
      });
    }

    return () => {
      cancelled = true;
      if (hls) {
        hls.destroy();
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [coverMedia.muted, coverMedia.videoUrl, isVideoCover, videoFailed]);

  const renderCoverArt = (desktop = false) => {
    const activeCoverWidth = desktop
      ? (hasExpandedVideoCover ? desktopVideoCoverWidth : desktopCoverWidth)
      : `${hasExpandedVideoCover ? mobileVideoCoverWidth : mobileCoverWidth}px`;

    return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, width: activeCoverWidth }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className={desktop
        ? 'relative shrink-0 origin-right'
        : `relative w-full ${useCompactStackedSizing ? 'mb-[clamp(1.1rem,0.98rem+0.4vw,1.6rem)]' : 'mb-[clamp(1.75rem,1.4rem+1.2vw,3rem)]'}`}
      style={desktop ? { width: activeCoverWidth } : { maxWidth: activeCoverWidth }}
    >
      <div className={`rc-player-cover relative w-full ${hasExpandedVideoCover ? 'aspect-video' : 'aspect-square'} overflow-hidden rounded-[clamp(1.125rem,0.95rem+0.7vw,1.75rem)] border shadow-[0_18px_42px_rgba(15,20,25,0.14)] ${coverBorderClass}`}>
        {hasExpandedVideoCover ? (
          <motion.video
            key={coverMedia.videoUrl}
            ref={videoRef}
            className="h-full w-full bg-black object-cover"
            muted={coverMedia.muted !== false}
            playsInline
            autoPlay
            preload="auto"
            onError={() => setVideoFailed(true)}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            aria-label={coverMedia.videoLabel || `${currentStation.name} live video`}
          />
        ) : (
          <motion.img
            key={coverMedia.coverPath || currentStation.coverArt}
            src={coverMedia.coverPath || coverMedia.fallbackCoverPath || currentStation.coverArt}
            alt={`${currentStation.name} cover art`}
            className="h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            whileHover={desktop ? { scale: 1.015 } : { scale: 1.02 }}
          />
        )}

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
  };

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
            data-dpad="true"
            data-dpad-group="player"
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

  if (isDesktopShell) {
    if (useCenteredDesktopStack) {
      return (
        <ResponsiveContainer section="radio" className="justify-center">
          <div className="mx-auto flex w-full max-w-[min(100%,58rem)] flex-col items-center text-center">
            {renderCoverArt(true)}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`flex w-full flex-col items-center ${
                useCompactDesktopSizing
                  ? 'mt-[clamp(0.95rem,0.82rem+0.46vw,1.35rem)] gap-[clamp(0.72rem,0.62rem+0.32vw,1.12rem)]'
                  : 'mt-[clamp(1.25rem,1rem+0.8vw,2rem)] gap-[clamp(0.9rem,0.72rem+0.55vw,1.5rem)]'
              }`}
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

              <div className={`flex w-full flex-col items-center text-center ${useCompactDesktopSizing ? 'max-w-[min(100%,33rem)]' : 'max-w-[min(100%,36rem)]'}`}>
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
                  {currentSubtitle}
                </Body>
              </div>

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
                      data-dpad="true"
                      data-dpad-group="player"
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

              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={togglePlay}
                disabled={isLoading}
                tabIndex={0}
                data-dpad="true"
                data-dpad-group="player"
                data-dpad-default="play"
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
            </motion.div>
          </div>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer section="radio" className="justify-center">
        <div
          className="grid w-screen min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-0"
          style={{
            marginLeft: 'calc(50% - 50vw)',
            marginRight: 'calc(50% - 50vw)',
          }}
        >
          <div
            className="flex min-w-0 justify-end pr-[clamp(1.5rem,2.8vw,4.5rem)]"
          >
            {renderCoverArt(true)}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex min-w-0 justify-start py-2 pl-[clamp(1.75rem,3vw,4.75rem)]"
          >
            <div
              className={`flex w-full min-w-0 flex-col items-start text-left ${
                useCenteredDesktopStack
                  ? 'max-w-[min(100%,30rem)] gap-[clamp(0.9rem,0.8rem+0.45vw,1.3rem)]'
                  : 'max-w-[min(100%,34rem)] gap-5'
              }`}
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

              <div
                className={`grid w-full min-w-0 items-start ${
                  useCenteredDesktopStack
                    ? 'gap-[clamp(0.85rem,0.76rem+0.32vw,1.1rem)]'
                    : 'gap-4'
                }`}
              >
                <div className="flex min-w-0 flex-col items-start text-left" style={{ minWidth: 0, width: '100%' }}>
                  <Heading
                    level={2}
                    color="custom"
                    className={`mb-1 max-w-full text-balance text-left ${desktopTitleClass} ${textPrimaryClass}`}
                    style={{ fontSize: desktopTitleSize }}
                  >
                    Radio Constanța
                  </Heading>
                  <Body
                    size="normal"
                    weight="medium"
                    opacity="custom"
                    className={`${textSecondaryClass} max-w-full text-pretty text-left`}
                    style={{ fontSize: desktopSubtitleSize, lineHeight: 1.25 }}
                  >
                    {currentSubtitle}
                  </Body>
                </div>
              </div>

              {streamInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`flex flex-wrap items-center justify-start gap-2 text-left ${desktopMetaClass}`}
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
                className="flex w-full justify-start gap-2"
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
                      data-dpad="true"
                      data-dpad-group="player"
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

              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={togglePlay}
                disabled={isLoading}
                tabIndex={0}
                data-dpad="true"
                data-dpad-group="player"
                data-dpad-default="play"
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
            </div>
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
          className={`${useCompactStackedSizing ? 'mb-[clamp(0.95rem,0.85rem+0.35vw,1.35rem)]' : 'mb-[clamp(1.75rem,1.35rem+1.2vw,3rem)]'} text-center`}
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
          data-dpad="true"
          data-dpad-group="player"
          data-dpad-default="play"
          className={`group focusable relative ${useCompactStackedSizing ? 'mb-[clamp(1rem,0.9rem+0.4vw,1.5rem)] h-[clamp(3.9rem,3.5rem+1.2vw,5rem)] w-[clamp(3.9rem,3.5rem+1.2vw,5rem)]' : 'mb-[clamp(1.75rem,1.35rem+1.2vw,3rem)] h-[clamp(4.5rem,3.9rem+1.8vw,7rem)] w-[clamp(4.5rem,3.9rem+1.8vw,7rem)]'} rounded-full bg-primary transition-all disabled:opacity-40`}
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
          className={`${useCompactStackedSizing ? 'mb-[clamp(0.72rem,0.66rem+0.2vw,0.95rem)] max-w-[min(100%,19rem)]' : 'mb-[clamp(1rem,0.82rem+0.65vw,2rem)] max-w-[min(100%,20rem)]'} flex w-full gap-[clamp(0.5rem,0.42rem+0.22vw,0.75rem)]`}
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
                data-dpad="true"
                data-dpad-group="player"
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
