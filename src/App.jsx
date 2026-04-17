import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useState, useRef, useEffect, createContext, useMemo } from 'react';
import Radio from './pages/Radio';
import BottomNav from './components/BottomNav';
import Loader from './components/Loader';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { createFloatingParticles } from './utils/createFloatingParticles';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { getWeatherManager } from './modules/weather/WeatherManager';
import { getLosslessStreamUrl, getLosslessFormatLabel } from './utils/osDetection';
import { useWeatherTextColor } from './hooks/useWeatherTextColor';
import analytics from './utils/analytics';

const loadNewsPage = () => import('./pages/News');
const loadAdminPage = () => import('./pages/Admin');
const loadSettingsModal = () => import('./components/SettingsModal');
const loadWeatherBackground = () => import('./components/WeatherBackground');
const loadWeatherCard = () => import('./components/WeatherCard');

const News = lazy(loadNewsPage);
const Admin = lazy(loadAdminPage);
const SettingsModal = lazy(loadSettingsModal);
const WeatherBackground = lazy(loadWeatherBackground);
const WeatherCard = lazy(loadWeatherCard);

// Create context for device info to share across components
export const DeviceContext = createContext(null);

const STATIONS = {
  fm: {
    id: 'fm',
    name: 'Radio Constanța',
    coverArt: '/rcfm.png',
    color: 'from-blue-500/20 to-cyan-500/20',
    qualities: [
      { id: 'mp3_128', label: '128 kbps', format: 'MP3', bitrate: '128 kbps', url: 'https://live.radioconstanta.ro/stream' },
      { id: 'mp3_256', label: '256 kbps', format: 'MP3', bitrate: '256 kbps', url: 'https://live.radioconstanta.ro/stream-256' },
      { id: 'flac', label: 'Lossless', format: 'FLAC', bitrate: '1024 kbps', url: 'https://live.radioconstanta.ro/stream-flac' }
    ],
    defaultQuality: 'flac'
  },
  folclor: {
    id: 'folclor',
    name: 'Radio Constanța Folclor',
    coverArt: '/rcf.png',
    color: 'from-purple-500/20 to-pink-500/20',
    qualities: [
      { id: 'mp3_128', label: '128 kbps', format: 'MP3', bitrate: '128 kbps', url: 'https://stream4.srr.ro:8443/radio-constanta-am' }
    ],
    defaultQuality: 'flac'
  }
};

const QUALITY_STORAGE_KEY = 'preferredStreamQuality';

const getPreferredDefaultQuality = (stationId, qualities = []) => {
  if (qualities.some((quality) => quality.id === 'flac')) {
    return 'flac';
  }

  return qualities[0]?.id || STATIONS[stationId].defaultQuality;
};

const readStoredQualityPreferences = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(QUALITY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to read stored quality preferences:', error);
    return {};
  }
};

const getInitialStationQuality = (stationId) => {
  const storedPreferences = readStoredQualityPreferences();
  const storedQuality = storedPreferences[stationId];
  const defaultQuality = STATIONS[stationId].defaultQuality;

  // Migrate older saved Folclor MP3 preference to the new lossless default.
  if (stationId === 'folclor' && defaultQuality === 'flac' && storedQuality === 'mp3_128') {
    return 'flac';
  }

  return storedQuality || defaultQuality;
};

function RouteFallback() {
  return (
    <div className="min-app-height flex items-center justify-center px-6">
      <Loader size="large" text="Se pregătește interfața..." />
    </div>
  );
}

function OverlayFallback() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-primary/60 backdrop-blur-sm">
      <Loader size="medium" text="Se încarcă..." />
    </div>
  );
}

function WeatherCardFallback({ width }) {
  return (
    <div
      className="w-full rounded-3xl border border-white/12 bg-white/8 p-6 shadow-2xl backdrop-blur-xl"
      style={{ width, maxWidth: 'min(100%, calc(var(--app-width) - 4rem))' }}
      aria-hidden="true"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-2/3 rounded bg-white/12" />
        <div className="h-16 rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/12" />
      </div>
    </div>
  );
}

// Inner component that checks for admin route (must be inside Router)
function RouteHandler({ children }) {
  const location = useLocation();

  if (location.pathname === '/admin') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Admin />
      </Suspense>
    );
  }

  return children;
}

function AppContent() {
  // Device detection
  const device = useDeviceDetection();

  // Settings
  const settings = useSettings();
  const weatherTextColor = useWeatherTextColor();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState(STATIONS.fm);
  const [selectedQuality, setSelectedQuality] = useState({
    fm: getInitialStationQuality('fm'),
    folclor: getInitialStationQuality('folclor')
  });
  const [metadata, setMetadata] = useState('');
  const [streamInfo, setStreamInfo] = useState(null);
  const audioRef = useRef(null);
  const audioEventCleanupRef = useRef(() => {});
  const isSwitchingRef = useRef(false);
  const isSwitchingQualityRef = useRef(false);
  const isPlayingRef = useRef(false);
  const playbackIntentRef = useRef(false);
  const selectedQualityRef = useRef({
    fm: getInitialStationQuality('fm'),
    folclor: getInitialStationQuality('folclor')
  });
  const pendingPlaybackTargetRef = useRef(null);
  const isPlaybackTransitionQueuedRef = useRef(false);
  const streamTransitionIdRef = useRef(0);
  const detectedSampleRateRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceNodeRef = useRef(null);
  const analyserRef = useRef(null);

  // Dynamic cover art state
  const [dynamicCovers, setDynamicCovers] = useState({
    fm: '/rcfm.png',
    folclor: '/rcf.png'
  });

  // Dynamic stream configurations from API
  const [dynamicStreams, setDynamicStreams] = useState(null);

  // News visibility toggle for wide screen
  const [showNews, setShowNews] = useState(false);
  const viewportWidth = device.viewportWidth || device.screenWidth || 0;
  const viewportHeight = device.viewportHeight || device.screenHeight || 0;
  const viewportAspectRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 1;
  const resizePolicy = useMemo(() => {
    const shellMode = device.shellMode || 'stacked';
    const viewportShape = device.viewportShape || 'tall';
    const isDesktopShell = shellMode === 'desktop';
    const topControlsCompact = device.isShortHeight;
    const preferredNewsShare = viewportAspectRatio >= 2.45
      ? 0.62
      : viewportAspectRatio >= 2.1
      ? 0.6
      : 0.58;
    const minNewsPaneWidth = viewportHeight;
    const minPlayerPaneWidth = Math.max(360, Math.min(460, viewportHeight * 0.6));
    const maxPlayerPaneWidth = Math.min(viewportHeight * 0.92, viewportWidth * 0.44);
    const preferredNewsWidth = viewportWidth * preferredNewsShare;
    const candidateNewsWidth = Math.max(
      minNewsPaneWidth,
      preferredNewsWidth,
      viewportWidth - maxPlayerPaneWidth
    );
    const candidatePlayerWidth = Math.max(0, viewportWidth - candidateNewsWidth);
    const candidateNewsAspectRatio = viewportHeight > 0 ? candidateNewsWidth / viewportHeight : 0;
    const candidatePlayerAspectRatio = viewportHeight > 0 ? candidatePlayerWidth / viewportHeight : 0;
    const canShowNewsRail = isDesktopShell
      && candidateNewsWidth + minPlayerPaneWidth <= viewportWidth
      && candidateNewsAspectRatio >= 1
      && candidatePlayerAspectRatio <= 0.92
      && candidateNewsWidth > candidatePlayerWidth;
    const showInlineNews = showNews && canShowNewsRail;
    const activePlayerPaneWidth = showInlineNews ? candidatePlayerWidth : viewportWidth;
    const activePlayerPaneAspectRatio = viewportHeight > 0
      ? activePlayerPaneWidth / viewportHeight
      : viewportAspectRatio;
    const showWeatherBackground = isDesktopShell
      && !showInlineNews
      && isPlaying
      && settings.backgroundAnimation === 'weather';
    const showWeatherCard = showWeatherBackground && viewportShape === 'wide';

    return {
      viewportShape,
      shellMode,
      isDesktopShell,
      canShowNewsRail,
      showInlineNews,
      activePlayerPaneWidth,
      activePlayerPaneAspectRatio,
      topControlsCompact,
      showWeatherBackground,
      showWeatherCard,
    };
  }, [
    device.shellMode,
    device.viewportShape,
    device.isShortHeight,
    viewportWidth,
    viewportHeight,
    viewportAspectRatio,
    showNews,
    isPlaying,
    settings.backgroundAnimation,
  ]);
  const showDesktopShell = resizePolicy.isDesktopShell;
  const isShortHeightShell = resizePolicy.topControlsCompact;
  const desktopUiTone = resizePolicy.showWeatherBackground
    ? weatherTextColor
    : 'light';
  const desktopActionSurfaceClass = desktopUiTone === 'dark'
    ? 'border-gray-900/18 bg-gray-900/10 text-gray-900 hover:bg-gray-900/16'
    : 'border-white/20 bg-white/12 text-white hover:bg-white/18';
  const desktopUiBorderColor = desktopUiTone === 'dark'
    ? 'rgba(17, 24, 39, 0.18)'
    : 'rgba(255, 255, 255, 0.20)';
  const desktopControlRailClass = desktopUiTone === 'dark'
    ? 'border-gray-900/12 bg-white/40 text-gray-900 shadow-[0_8px_20px_rgba(15,23,42,0.07)]'
    : 'border-white/14 bg-slate-950/18 text-white shadow-[0_10px_26px_rgba(2,6,23,0.16)]';

  // Generate floating particles for background animation
  const floatingParticles = useMemo(() => {
    // Fewer particles for better performance, they're subtle anyway
    return createFloatingParticles(60);
  }, []);

  // Fetch dynamic covers from API (fallback for SSE failure)
  const fetchCurrentCovers = async () => {
    console.log('[App] Fetching current covers...');
    try {
      const fmResponse = await fetch('/api/admin/covers/current/fm');
      const folclorResponse = await fetch('/api/admin/covers/current/folclor');

      console.log('[App] FM response status:', fmResponse.status);
      console.log('[App] Folclor response status:', folclorResponse.status);

      if (fmResponse.ok && folclorResponse.ok) {
        const fmData = await fmResponse.json();
        const folclorData = await folclorResponse.json();

        console.log('[App] FM cover data:', fmData);
        console.log('[App] Folclor cover data:', folclorData);

        const newCovers = {
          fm: fmData.coverPath || '/rcfm.png',
          folclor: folclorData.coverPath || '/rcf.png'
        };

        console.log('[App] Setting dynamic covers:', newCovers);
        setDynamicCovers(newCovers);
      }
    } catch (error) {
      console.error('[App] Error fetching covers:', error);
    }
  };

  // Fetch stream configurations from API
  const fetchStreamConfigurations = async () => {
    console.log('[App] Fetching stream configurations...');
    try {
      const response = await fetch('/api/admin/public-settings');

      if (response.ok) {
        const data = await response.json();
        console.log('[App] Stream config data:', data);

        if (data.radioStreams) {
          // Convert new format to old format
          const convertStreamConfig = (stationConfig) => {
            const qualities = [];

            // MP3 128 kbps
            if (stationConfig.mp3_128?.enabled && stationConfig.mp3_128?.url) {
              qualities.push({
                id: 'mp3_128',
                label: stationConfig.mp3_128.label || 'MP3 128 kbps',
                format: 'MP3',
                bitrate: '128 kbps',
                url: stationConfig.mp3_128.url
              });
            }

            // MP3 256 kbps
            if (stationConfig.mp3_256?.enabled && stationConfig.mp3_256?.url) {
              qualities.push({
                id: 'mp3_256',
                label: stationConfig.mp3_256.label || 'MP3 256 kbps',
                format: 'MP3',
                bitrate: '256 kbps',
                url: stationConfig.mp3_256.url
              });
            }

            // FLAC/ALAC - use appropriate URL based on OS
            if (stationConfig.flac?.enabled) {
              const losslessUrl = getLosslessStreamUrl(
                stationConfig.flac.url,
                stationConfig.flac.alacUrl
              );

              if (losslessUrl) {
                qualities.push({
                  id: 'flac',
                  label: 'Lossless',
                  format: getLosslessFormatLabel(), // Show actual format based on OS
                  bitrate: '1024 kbps',
                  url: losslessUrl
                });
              }
            }

            return qualities;
          };

          const newStreams = {
            fm: convertStreamConfig(data.radioStreams.fm || {}),
            folclor: convertStreamConfig(data.radioStreams.folclor || {})
          };

          console.log('[App] Converted stream configs:', newStreams);
          setDynamicStreams(newStreams);
        }
      }
    } catch (error) {
      console.error('[App] Error fetching stream configurations:', error);
    }
  };

  // Set up SSE connection for real-time cover updates
  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds between reconnects

    const connectToSSE = () => {
      console.log('[App] Connecting to cover SSE stream...');

      try {
        eventSource = new EventSource('/api/admin/covers/stream');

        eventSource.onopen = () => {
          console.log('[App] ✅ SSE connection established');
          reconnectAttempts = 0; // Reset on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[App] SSE message received:', data);

            if (data.type === 'covers' && data.covers) {
              console.log('[App] Updating covers from SSE:', data.covers);
              setDynamicCovers({
                fm: data.covers.fm || '/rcfm.png',
                folclor: data.covers.folclor || '/rcf.png'
              });
            }
          } catch (error) {
            console.error('[App] Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('[App] SSE connection error:', error);
          eventSource.close();

          // Exponential backoff for reconnection
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY);
          console.log(`[App] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

          reconnectTimeout = setTimeout(() => {
            connectToSSE();
          }, delay);
        };
      } catch (error) {
        console.error('[App] Error creating SSE connection:', error);
        // Fallback to polling if SSE fails completely
        console.log('[App] Falling back to polling...');
        fetchCurrentCovers();
      }
    };

    // Initial fetch for stream configurations (not real-time)
    fetchStreamConfigurations();

    // Start SSE connection for covers
    connectToSSE();

    // Poll stream configurations every 30 seconds (they change rarely)
    const streamConfigInterval = setInterval(() => {
      fetchStreamConfigurations();
    }, 30000);

    // Cleanup on unmount
    return () => {
      console.log('[App] Cleaning up SSE connection...');
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (streamConfigInterval) {
        clearInterval(streamConfigInterval);
      }
    };
  }, []);

  // Create station objects with dynamic covers and streams
  const stationsWithDynamicCovers = useMemo(() => {
    // Use dynamic streams if available, otherwise fall back to hardcoded STATIONS
    const fmQualities = dynamicStreams?.fm?.length > 0 ? dynamicStreams.fm : STATIONS.fm.qualities;
    const folclorQualities = dynamicStreams?.folclor?.length > 0 ? dynamicStreams.folclor : STATIONS.folclor.qualities;

    return {
      fm: {
        ...STATIONS.fm,
        coverArt: dynamicCovers.fm,
        qualities: fmQualities,
        defaultQuality: getPreferredDefaultQuality('fm', fmQualities)
      },
      folclor: {
        ...STATIONS.folclor,
        coverArt: dynamicCovers.folclor,
        qualities: folclorQualities,
        defaultQuality: getPreferredDefaultQuality('folclor', folclorQualities)
      }
    };
  }, [dynamicCovers, dynamicStreams]);

  const resolveQualityForStation = (stationId, preferredQualityId) => {
    const station = stationsWithDynamicCovers[stationId];
    if (!station) {
      return null;
    }

    return station.qualities.find((quality) => quality.id === preferredQualityId)
      || station.qualities.find((quality) => quality.id === station.defaultQuality)
      || station.qualities[0]
      || null;
  };

  // Update current station when covers change
  useEffect(() => {
    setCurrentStation(prevStation =>
      stationsWithDynamicCovers[prevStation.id]
    );
  }, [stationsWithDynamicCovers]);

  useEffect(() => {
    setSelectedQuality((prev) => {
      const nextFmPreference = prev.fm || getInitialStationQuality('fm');
      const nextFolclorPreference = prev.folclor || getInitialStationQuality('folclor');

      const next = {
        fm: resolveQualityForStation('fm', nextFmPreference)?.id || stationsWithDynamicCovers.fm.defaultQuality,
        folclor: resolveQualityForStation('folclor', nextFolclorPreference)?.id || stationsWithDynamicCovers.folclor.defaultQuality
      };

      if (next.fm === prev.fm && next.folclor === prev.folclor) {
        return prev;
      }

      return next;
    });
  }, [stationsWithDynamicCovers]);

  useEffect(() => {
    selectedQualityRef.current = selectedQuality;
    localStorage.setItem(QUALITY_STORAGE_KEY, JSON.stringify(selectedQuality));
  }, [selectedQuality]);

  // Helper to log debug info
  const logDebug = (message) => {
    console.log(message);
  };

  const getAbsoluteStreamUrl = (url) => {
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return url;
    }
  };

  // Get current quality object for the current station
  const getCurrentQuality = () => {
    return resolveQualityForStation(currentStation.id, selectedQuality[currentStation.id]) || currentStation.qualities[0];
  };

  // Get stream URL for current station and quality
  const getStreamUrl = () => {
    return getCurrentQuality().url;
  };

  const getStationQualityCandidates = (stationId, preferredQualityId) => {
    const station = stationsWithDynamicCovers[stationId];
    if (!station) {
      return [];
    }

    const preferred = resolveQualityForStation(stationId, preferredQualityId);
    const candidates = [];

    if (preferred) {
      candidates.push(preferred);
    }

    station.qualities.forEach((quality) => {
      if (!candidates.some((candidate) => candidate.id === quality.id)) {
        candidates.push(quality);
      }
    });

    return candidates;
  };

  const buildStreamInfoFromQuality = (quality, audio) => {
    let channels = 'Stereo';
    let sampleRate = detectedSampleRateRef.current || '48.0 kHz';

    if (!detectedSampleRateRef.current && audioContextRef.current) {
      detectedSampleRateRef.current = `${(audioContextRef.current.sampleRate / 1000).toFixed(1)} kHz`;
      sampleRate = detectedSampleRateRef.current;
    } else if (!detectedSampleRateRef.current && (window.AudioContext || window.webkitAudioContext)) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        detectedSampleRateRef.current = `${(audioContext.sampleRate / 1000).toFixed(1)} kHz`;
        sampleRate = detectedSampleRateRef.current;
        audioContext.close().catch(() => {});
      } catch (e) {
        console.log('AudioContext not available:', e);
      }
    }

    return {
      format: quality.format,
      bitrate: quality.bitrate,
      channels,
      sampleRate
    };
  };

  const waitForAudioReset = (audio, transitionId, timeoutMs = 400) => new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      audio.removeEventListener('emptied', finish);
      audio.removeEventListener('abort', finish);
      clearTimeout(timeoutId);
      resolve(transitionId === streamTransitionIdRef.current);
    };

    const timeoutId = setTimeout(finish, timeoutMs);

    audio.addEventListener('emptied', finish, { once: true });
    audio.addEventListener('abort', finish, { once: true });
  });

  const waitForPlaybackStart = (audio, transitionId, playPromise, timeoutMs = 8000) => new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      audio.removeEventListener('playing', handleSuccess);
      audio.removeEventListener('error', handleError);
      clearTimeout(timeoutId);
    };

    const settle = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const handleSuccess = () => {
      settle(() => {
        if (transitionId !== streamTransitionIdRef.current) {
          reject(new Error('Stale stream transition'));
          return;
        }

        resolve();
      });
    };

    const handleError = () => {
      const code = audio.error?.code;
      const message = audio.error?.message || `Audio error ${code || 'unknown'}`;
      settle(() => reject(new Error(message)));
    };

    const timeoutId = setTimeout(() => {
      settle(() => reject(new Error('Timed out while starting stream')));
    }, timeoutMs);

    audio.addEventListener('playing', handleSuccess, { once: true });
    audio.addEventListener('error', handleError, { once: true });

    Promise.resolve(playPromise)
      .then(handleSuccess)
      .catch((error) => {
        settle(() => reject(error));
      });
  });

  const transitionToStream = async ({ stationId, qualityId }) => {
    const station = stationsWithDynamicCovers[stationId];
    const quality = resolveQualityForStation(stationId, qualityId);

    if (!station || !quality?.url) {
      throw new Error('Missing stream target');
    }

    const transitionId = ++streamTransitionIdRef.current;
    detectedSampleRateRef.current = null;
    const nextUrl = getAbsoluteStreamUrl(quality.url);
    let audio = audioRef.current;

    if (!audio) {
      throw new Error('Audio element is not initialized');
    }

    audio.pause();
    audio.removeAttribute('src');
    audio.load();

    const resetCompleted = await waitForAudioReset(audio, transitionId);
    if (!resetCompleted) {
      throw new Error('Superseded stream transition');
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    logDebug(`Transitioning stream: ${nextUrl}`);
    setStreamInfo(null);
    audio.src = nextUrl;
    audio.load();
    setIsLoading(true);

    const playPromise = audio.play();
    await waitForPlaybackStart(audio, transitionId, playPromise);
    ensureAudioAnalyser();
    setStreamInfo(buildStreamInfoFromQuality(quality, audio));

    return { station, quality };
  };

  const attemptStreamPlayback = async ({ stationId, preferredQualityId, persistFallback = true }) => {
    const candidates = getStationQualityCandidates(stationId, preferredQualityId);
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const result = await transitionToStream({
          stationId,
          qualityId: candidate.id
        });

        if (persistFallback && candidate.id !== preferredQualityId) {
          setSelectedQuality((prev) => ({
            ...prev,
            [stationId]: candidate.id
          }));
          logDebug(`Using fallback quality for ${stationId}: ${candidate.id}`);
        }

        return result;
      } catch (error) {
        lastError = error;
        logDebug(`✗ Stream candidate failed for ${stationId}/${candidate.id}: ${error.message}`);
      }
    }

    throw lastError || new Error('No playable stream candidates');
  };

  const processPendingPlaybackTarget = async () => {
    if (isPlaybackTransitionQueuedRef.current) {
      return;
    }

    isPlaybackTransitionQueuedRef.current = true;

    while (pendingPlaybackTargetRef.current) {
      const request = pendingPlaybackTargetRef.current;
      pendingPlaybackTargetRef.current = null;

      isSwitchingRef.current = request.reason === 'station';
      isSwitchingQualityRef.current = request.reason === 'quality';
      setIsLoading(true);

      try {
        const { quality } = await attemptStreamPlayback({
          stationId: request.stationId,
          preferredQualityId: request.qualityId
        });

        if (request.reason === 'station') {
          analytics.trackStationSwitch(request.stationId, quality.id);
        } else if (request.reason === 'quality') {
          analytics.trackQualityChange(request.stationId, quality.id);
        }
      } catch (error) {
        logDebug(`✗ Queued playback transition failed: ${error.message}`);

        if (!pendingPlaybackTargetRef.current) {
          playbackIntentRef.current = false;
          analytics.trackStreamStop();
          setIsLoading(false);
          setStreamInfo(null);
        }
      } finally {
        isSwitchingRef.current = false;
        isSwitchingQualityRef.current = false;
      }
    }

    isPlaybackTransitionQueuedRef.current = false;
  };

  const schedulePlaybackTransition = ({ stationId, qualityId, reason }) => {
    playbackIntentRef.current = true;
    pendingPlaybackTargetRef.current = {
      stationId,
      qualityId,
      reason
    };
    void processPendingPlaybackTarget();
  };

  const ensureAudioAnalyser = () => {
    const audio = audioRef.current;
    if (!audio || analyserRef.current || !(window.AudioContext || window.webkitAudioContext)) {
      return analyserRef.current;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const sourceNode = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.minDecibels = -96;
      analyser.maxDecibels = -20;
      analyser.smoothingTimeConstant = 0.58;

      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      audioSourceNodeRef.current = sourceNode;
      analyserRef.current = analyser;
    } catch (error) {
      console.warn('Unable to initialize audio analyser:', error);
    }

    return analyserRef.current;
  };

  // Create Audio element (HTML5 approach - mobile friendly)
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous'; // For CORS
    audio.setAttribute('playsinline', ''); // iOS Safari
    audio.setAttribute('webkit-playsinline', ''); // Older iOS

    const handlePlaying = () => {
      logDebug('✓ playing event');
      isPlayingRef.current = true;
      playbackIntentRef.current = true;
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      logDebug('pause event');
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleError = () => {
      const error = audio.error;

      if (isSwitchingRef.current || isSwitchingQualityRef.current) {
        if (error?.code === 4 || error?.code === 3) {
          logDebug(`⚠ Ignoring expected error (code ${error?.code}) during switch`);
          return;
        }
      }

      logDebug(`✗ error: code=${error?.code}, msg=${error?.message}`);
      isPlayingRef.current = false;
      if (!pendingPlaybackTargetRef.current) {
        playbackIntentRef.current = false;
      }
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      logDebug('⚠ buffering');
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      logDebug(`canplay: ready=${audio.readyState}`);
      setIsLoading(false);
    };

    const handleStalled = () => {
      logDebug('⚠ stalled');
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('stalled', handleStalled);
    audioEventCleanupRef.current = () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('stalled', handleStalled);
    };
    audioRef.current = audio;

    return () => {
      const currentAudio = audioRef.current || audio;
      audioEventCleanupRef.current?.();
      currentAudio.pause();
      currentAudio.src = '';
      audioRef.current = null;
      isPlayingRef.current = false;
      playbackIntentRef.current = false;
      analyserRef.current = null;
      audioSourceNodeRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  // Update stream info based on current station and quality
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateStreamInfo = () => {
      const quality = getCurrentQuality();
      setStreamInfo(buildStreamInfoFromQuality(quality, audio));
    };

    const handleLoadedMetadata = () => {
      updateStreamInfo();
    };

    const handleCanPlay = () => {
      updateStreamInfo();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);

    // Update immediately if already loaded
    if (audio.readyState >= 1) {
      updateStreamInfo();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentStation, selectedQuality]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    const streamUrl = getStreamUrl();

    if (!audio || !streamUrl) {
      logDebug('No audio or URL');
      return;
    }

    // If paused, start playing
    if (audio.paused) {
      try {
        playbackIntentRef.current = true;
        if (!audio.src || audio.src !== getAbsoluteStreamUrl(streamUrl)) {
          const { quality } = await attemptStreamPlayback({
            stationId: currentStation.id,
            preferredQualityId: selectedQuality[currentStation.id]
          });
          logDebug(`Started with quality ${quality.id}`);
          analytics.trackStreamStart(currentStation.id, quality.id);
        } else {
          if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume().catch(() => {});
          }

          logDebug(`play() - paused=${audio.paused}, ready=${audio.readyState}`);
          setIsLoading(true);
          await audio.play();
          ensureAudioAnalyser();
        }

        logDebug('✓ play() success');
        if (audio.src === getAbsoluteStreamUrl(streamUrl)) {
          analytics.trackStreamStart(currentStation.id, selectedQuality[currentStation.id]);
        }
      } catch (err) {
        logDebug(`✗ play() failed: ${err.message}`);
        playbackIntentRef.current = false;
        setIsLoading(false);
        setStreamInfo(null);
      }
    } else {
      // Pause
      logDebug('pause()');
      playbackIntentRef.current = false;
      audio.pause();

      // Track stream stop
      analytics.trackStreamStop();
    }
  };

  const switchStation = async (station) => {
    if (currentStation.id === station.id) {
      return;
    }

    logDebug(`Switching to ${station.name}`);
    const shouldMaintainPlayback = playbackIntentRef.current
      || Boolean(audioRef.current && (!audioRef.current.paused || isLoading));

    try {
      // Update station
      setCurrentStation(station);

      logDebug('Station switched');

      if (shouldMaintainPlayback) {
        logDebug('Queueing autoplay after station switch');
        schedulePlaybackTransition({
          stationId: station.id,
          qualityId: selectedQualityRef.current[station.id] || station.defaultQuality,
          reason: 'station'
        });
      }
    } catch (error) {
      logDebug(`✗ Switch error: ${error.message}`);
      setIsLoading(false);
      setStreamInfo(null);
    }
  };

  const setStationQualityPreference = async (stationId, qualityId) => {
    const station = stationsWithDynamicCovers[stationId];
    if (!station) {
      return;
    }

    if (selectedQuality[stationId] === qualityId) {
      return; // Already selected
    }

    logDebug(`Switching quality for ${stationId} to ${qualityId}`);

    try {
      // Update selected quality
      const nextSelectedQuality = {
        ...selectedQualityRef.current,
        [stationId]: qualityId
      };
      selectedQualityRef.current = nextSelectedQuality;
      setSelectedQuality(nextSelectedQuality);

      if (stationId !== currentStation.id) {
        return;
      }

      const shouldMaintainPlayback = playbackIntentRef.current
        || Boolean(audioRef.current && (!audioRef.current.paused || isLoading));
      if (shouldMaintainPlayback) {
        schedulePlaybackTransition({
          stationId,
          qualityId,
          reason: 'quality'
        });
      }
    } catch (error) {
      logDebug(`✗ Quality switch error: ${error.message}`);
    }
  };

  // Functions to pause/resume radio from article audio players
  const pauseRadio = () => {
    if (audioRef.current && isPlaying) {
      playbackIntentRef.current = false;
      audioRef.current.pause();
      return true; // Return true if we paused
    }
    return false;
  };

  // Aggressive stop for mobile - fully releases audio focus
  const stopRadio = () => {
    if (audioRef.current) {
      const wasSrc = audioRef.current.src;
      playbackIntentRef.current = false;
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear source to release audio session
      return wasSrc; // Return old src so it can be restored
    }
    return null;
  };

  const resumeRadio = () => {
    if (audioRef.current && !isPlaying && audioRef.current.src) {
      playbackIntentRef.current = true;
      audioRef.current.play().catch(err => {
        logDebug(`Resume failed: ${err.message}`);
      });
    }
  };

  // Restore radio with specific URL (used after stopRadio)
  const restoreRadio = (srcUrl) => {
    if (audioRef.current && srcUrl) {
      audioRef.current.src = srcUrl;
      audioRef.current.load();
    }
  };

  const radioState = {
    isPlaying,
    isLoading,
    currentStation,
    metadata,
    streamInfo,
    stations: Object.values(stationsWithDynamicCovers), // Convert to array with dynamic covers
    selectedQuality: selectedQuality[currentStation.id],
    availableQualities: currentStation.qualities,
    togglePlay,
    switchStation,
    switchQuality: setStationQualityPreference,
    pauseRadio,
    stopRadio,
    resumeRadio,
    restoreRadio,
    showWeatherBackground: resizePolicy.showWeatherBackground,
    audioAnalyserRef: analyserRef,
    forceCompactLayout: resizePolicy.showInlineNews,
    shortHeightLayout: isShortHeightShell,
    availablePaneAspectRatio: resizePolicy.activePlayerPaneAspectRatio,
  };

  const desktopWeatherCardWidth = Math.min(460, Math.max(280, Math.round(viewportWidth * 0.24)));

  useEffect(() => {
    const preloadLikelyNextViews = () => {
      loadNewsPage();
      loadSettingsModal();
    };

    let timeoutId = null;
    let idleCallbackId = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(preloadLikelyNextViews, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(preloadLikelyNextViews, 1200);
    }

    return () => {
      if (typeof window !== 'undefined' && idleCallbackId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  // Preload weather data on wide displays so it is ready when playback starts.
  useEffect(() => {
    if (!resizePolicy.isDesktopShell || settings.backgroundAnimation !== 'weather') {
      return;
    }

    const weatherManager = getWeatherManager();
    let cancelled = false;

    const preloadWeather = async () => {
      try {
        weatherManager.location = {
          lat: settings.weatherLocation.lat,
          lon: settings.weatherLocation.lon,
          name: settings.weatherLocation.name
        };

        if (settings.weatherMode === 'manual') {
          const isNight = settings.manualWeatherState.timeOfDay === 'night';
          weatherManager.setManualWeather(settings.manualWeatherState.weatherType, isNight);
          return;
        }

        weatherManager.isAutoMode = true;

        if (weatherManager.currentWeather) {
          await weatherManager.fetchWeather();
        } else {
          await weatherManager.initialize(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to preload weather:', error);
        }
      }
    };

    preloadWeather();

    return () => {
      cancelled = true;
    };
  }, [
    resizePolicy.isDesktopShell,
    settings.backgroundAnimation,
    settings.weatherMode,
    settings.weatherLocation,
    settings.manualWeatherState
  ]);

  useEffect(() => {
    if (settings.backgroundAnimation !== 'weather') {
      return;
    }

    loadWeatherBackground();
    loadWeatherCard();
  }, [settings.backgroundAnimation]);

  useEffect(() => {
    if ((!resizePolicy.isDesktopShell || !resizePolicy.canShowNewsRail) && showNews) {
      setShowNews(false);
    }
  }, [resizePolicy.isDesktopShell, resizePolicy.canShowNewsRail, showNews]);

  const deviceContextValue = useMemo(() => ({
    ...device,
    policy: resizePolicy,
  }), [device, resizePolicy]);

  return (
    <DeviceContext.Provider value={deviceContextValue}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteHandler>
          <div className="min-app-height bg-bg-primary">
          {showDesktopShell ? (
            // Desktop/TV: Radio-focused layout with optional news
            <div className={`min-app-height relative flex items-center justify-center overflow-hidden ${
              !resizePolicy.showInlineNews && isPlaying && settings.backgroundAnimation === 'minimal' ? 'animated-gradient' :
              settings.backgroundAnimation === 'none' ? 'bg-bg-secondary' : 'bg-bg-secondary'
            }`}>
              {/* Weather Background - Full screen behind everything */}
              {resizePolicy.showWeatherBackground && (
                <Suspense fallback={null}>
                  <WeatherBackground />
                </Suspense>
              )}
              {/* Top Right Buttons */}
              <div className="absolute right-3 top-3 z-50">
                <div className={`flex items-center gap-2 rounded-[1.15rem] px-2 py-2 backdrop-blur-xl ${desktopControlRailClass}`}>
                {/* Settings Button */}
                <motion.button
                  onClick={() => setShowSettingsModal(true)}
                  onMouseEnter={loadSettingsModal}
                  onFocus={loadSettingsModal}
                  className={`flex items-center justify-center rounded-[0.95rem] backdrop-blur-sm transition-all ${isShortHeightShell ? 'h-10 w-10' : 'h-12 w-12'} ${desktopActionSurfaceClass}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Settings"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.button>

                {resizePolicy.canShowNewsRail && (
                  <motion.button
                    onClick={() => setShowNews(!showNews)}
                    onMouseEnter={loadNewsPage}
                    onFocus={loadNewsPage}
                    className={`flex items-center justify-center rounded-[0.95rem] backdrop-blur-sm transition-all ${isShortHeightShell ? 'h-10 w-10' : 'h-12 w-12'} ${desktopActionSurfaceClass}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={showNews ? 'Hide news' : 'Show news'}
                  >
                    {showNews ? (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </motion.button>
                )}
                </div>
              </div>

              {/* Content Container */}
              <div className="app-height relative w-full overflow-hidden">
                {/* Radio Section */}
                <div
                  className={`relative overflow-hidden transition-all duration-500 ${
                    showNews
                      ? 'h-full border-r border-white/10'
                      : 'h-full w-full'
                  }`}
                  style={resizePolicy.showInlineNews ? { width: `${resizePolicy.activePlayerPaneWidth}px` } : undefined}
                >
                  {/* Floating particles animation - only show for minimal background */}
                  {!resizePolicy.showInlineNews && isPlaying && settings.backgroundAnimation === 'minimal' && (
                    <>
                      <style dangerouslySetInnerHTML={{
                        __html: floatingParticles.map((particle) => `
                          @keyframes particle-move-${particle.id} {
                            from {
                              transform: translate3d(${particle.startX}vw, ${particle.startY}vh, 0);
                            }
                            to {
                              transform: translate3d(${particle.endX}vw, ${particle.endY}vh, 0);
                            }
                          }
                        `).join('\n')
                      }} />
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {floatingParticles.map((particle) => (
                          <div
                            key={particle.id}
                            className="floating-particle-container"
                            style={{
                              width: `${particle.size}px`,
                              height: `${particle.size}px`,
                              transform: `translate3d(${particle.startX}vw, ${particle.startY}vh, 0)`,
                              animation: `particle-move-${particle.id} ${particle.duration}s linear ${particle.delay}s infinite`,
                            }}
                          >
                            <div
                              className="floating-particle"
                              style={{
                                animationDelay: `${particle.scaleDelay}s`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className={`relative z-10 flex h-full w-full justify-center ${
                    resizePolicy.showInlineNews
                      ? 'items-center overflow-hidden px-[clamp(1.25rem,1.05rem+0.8vw,2.5rem)] pt-[clamp(4.9rem,4.45rem+1.1vw,6.15rem)] pb-[clamp(1.25rem,1rem+0.7vw,2rem)]'
                      : isShortHeightShell
                      ? 'items-center px-[clamp(1rem,0.88rem+0.42vw,1.5rem)] py-[clamp(1rem,0.88rem+0.42vw,1.5rem)]'
                      : 'items-center px-[clamp(1.5rem,1.28rem+0.85vw,3rem)] py-[clamp(2rem,1.65rem+1.2vw,3.5rem)]'
                  }`}>
                    <div className={`flex w-full justify-center ${resizePolicy.showInlineNews ? 'h-full items-center min-h-0' : 'h-full items-center'}`}>
                      <Radio radioState={radioState} />
                    </div>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{
                      opacity: resizePolicy.showWeatherCard ? 1 : 0,
                      x: resizePolicy.showWeatherCard ? 0 : -20,
                      y: resizePolicy.showWeatherCard ? 0 : 12
                    }}
                    transition={{ delay: resizePolicy.showWeatherCard ? 0.2 : 0, duration: 0.35 }}
                    className={`pointer-events-none absolute bottom-8 left-8 z-20 3xl:bottom-10 3xl:left-10 ${
                      resizePolicy.showWeatherCard ? 'pointer-events-auto' : ''
                    }`}
                  >
                    <Suspense fallback={<WeatherCardFallback width={`${desktopWeatherCardWidth}px`} />}>
                      <WeatherCard style={{ width: `${desktopWeatherCardWidth}px`, maxWidth: 'min(100%, calc(var(--app-width) - 4rem))' }} />
                    </Suspense>
                  </motion.div>
                </div>

                {/* News Section - Slide in from right */}
                <AnimatePresence>
                  {resizePolicy.showInlineNews && (
                    <motion.div
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className="absolute inset-y-0 right-0 z-30 overflow-y-auto scrollbar-hide border-l border-white/10 bg-[linear-gradient(180deg,rgba(13,18,28,0.96),rgba(9,13,22,0.98))] shadow-[-28px_0_60px_rgba(3,7,18,0.34)]"
                      style={{ left: `${resizePolicy.activePlayerPaneWidth}px` }}
                    >
                      <div className="h-full w-full">
                        <Suspense fallback={<RouteFallback />}>
                          <News radioState={radioState} />
                        </Suspense>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            // Mobile/Tablet: Single page with routing
            <>
              <AnimatePresence mode="wait">
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Radio radioState={radioState} />} />
                    <Route path="/news" element={<News radioState={radioState} />} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
              <BottomNav />
            </>
          )}
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <Suspense fallback={<OverlayFallback />}>
            <SettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              stations={Object.values(stationsWithDynamicCovers)}
              selectedQualities={selectedQuality}
              onQualityChange={setStationQualityPreference}
            />
          </Suspense>
        )}
        </RouteHandler>
      </Router>
    </DeviceContext.Provider>
  );
}

// Wrap with SettingsProvider
function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
