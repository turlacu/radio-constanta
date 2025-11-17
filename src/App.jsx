import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect, createContext, useMemo } from 'react';
import Radio from './pages/Radio';
import News from './pages/News';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';
import SettingsModal from './components/SettingsModal';
import WeatherBackground from './components/WeatherBackground';
import WeatherCard from './components/WeatherCard';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { createFloatingParticles } from './utils/createFloatingParticles';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { getLosslessStreamUrl } from './utils/osDetection';

// Create context for device info to share across components
export const DeviceContext = createContext(null);

const STATIONS = {
  fm: {
    id: 'fm',
    name: 'Radio Constanța FM',
    coverArt: '/rcfm.png',
    color: 'from-blue-500/20 to-cyan-500/20',
    qualities: [
      { id: '128', label: '128 kbps', format: 'MP3', bitrate: '128 kbps', url: 'https://stream4.srr.ro:8443/radio-constanta-fm' },
      { id: 'flac', label: 'FLAC', format: 'FLAC', bitrate: '1024 kbps', url: 'https://stream4.srr.ro:8443/radio-constanta-flac' }
    ],
    defaultQuality: '128'
  },
  folclor: {
    id: 'folclor',
    name: 'Radio Constanța Folclor',
    coverArt: '/rcf.png',
    color: 'from-purple-500/20 to-pink-500/20',
    qualities: [
      { id: '128', label: '128 kbps', format: 'MP3', bitrate: '128 kbps', url: 'https://stream4.srr.ro:8443/radio-constanta-am' }
    ],
    defaultQuality: '128'
  }
};

// Inner component that checks for admin route (must be inside Router)
function RouteHandler({ children }) {
  const location = useLocation();

  if (location.pathname === '/admin') {
    return <Admin />;
  }

  return children;
}

function AppContent() {
  // Device detection
  const device = useDeviceDetection();

  // Settings
  const settings = useSettings();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState(STATIONS.fm);
  const [selectedQuality, setSelectedQuality] = useState({
    fm: STATIONS.fm.defaultQuality,
    folclor: STATIONS.folclor.defaultQuality
  });
  const [metadata, setMetadata] = useState('');
  const [streamInfo, setStreamInfo] = useState(null);
  const audioRef = useRef(null);
  const isSwitchingRef = useRef(false);
  const isSwitchingQualityRef = useRef(false);

  // Dynamic cover art state
  const [dynamicCovers, setDynamicCovers] = useState({
    fm: '/rcfm.png',
    folclor: '/rcf.png'
  });

  // Dynamic stream configurations from API
  const [dynamicStreams, setDynamicStreams] = useState(null);

  // News visibility toggle for wide screen
  const [showNews, setShowNews] = useState(false);

  // Generate floating particles for background animation
  const floatingParticles = useMemo(() => {
    // Fewer particles for better performance, they're subtle anyway
    return createFloatingParticles(60);
  }, []);

  // Fetch dynamic covers from API
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
                  label: stationConfig.flac.label || 'FLAC/ALAC',
                  format: 'FLAC/ALAC',
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

  // Fetch covers and stream configurations on mount and poll every 30 seconds
  useEffect(() => {
    fetchCurrentCovers();
    fetchStreamConfigurations();

    const interval = setInterval(() => {
      fetchCurrentCovers();
      fetchStreamConfigurations();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
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
        defaultQuality: fmQualities[0]?.id || STATIONS.fm.defaultQuality
      },
      folclor: {
        ...STATIONS.folclor,
        coverArt: dynamicCovers.folclor,
        qualities: folclorQualities,
        defaultQuality: folclorQualities[0]?.id || STATIONS.folclor.defaultQuality
      }
    };
  }, [dynamicCovers, dynamicStreams]);

  // Update current station when covers change
  useEffect(() => {
    setCurrentStation(prevStation =>
      stationsWithDynamicCovers[prevStation.id]
    );
  }, [stationsWithDynamicCovers]);

  // Helper to log debug info
  const logDebug = (message) => {
    console.log(message);
  };

  // Get current quality object for the current station
  const getCurrentQuality = () => {
    const qualityId = selectedQuality[currentStation.id];
    return currentStation.qualities.find(q => q.id === qualityId) || currentStation.qualities[0];
  };

  // Get stream URL for current station and quality
  const getStreamUrl = () => {
    return getCurrentQuality().url;
  };

  // Create Audio element (HTML5 approach - mobile friendly)
  useEffect(() => {
    // Create audio element and append to document
    const audio = document.createElement('audio');
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous'; // For CORS
    audio.setAttribute('playsinline', ''); // iOS Safari
    audio.setAttribute('webkit-playsinline', ''); // Older iOS
    audioRef.current = audio;

    // Simple event handlers
    audio.addEventListener('playing', () => {
      logDebug('✓ playing event');
      setIsPlaying(true);
      setIsLoading(false);
    });

    audio.addEventListener('pause', () => {
      logDebug('pause event');
      setIsPlaying(false);
      setIsLoading(false);
    });

    audio.addEventListener('error', (e) => {
      const error = audio.error;

      // Ignore expected errors during switching operations
      if (isSwitchingRef.current || isSwitchingQualityRef.current) {
        // Code 4: Empty src attribute (from clearing source)
        // Code 3: Decode errors (from flushing decoder pipeline)
        if (error?.code === 4 || error?.code === 3) {
          logDebug(`⚠ Ignoring expected error (code ${error?.code}) during switch`);
          return;
        }
      }

      logDebug(`✗ error: code=${error?.code}, msg=${error?.message}`);
      setIsPlaying(false);
      setIsLoading(false);
    });

    audio.addEventListener('waiting', () => {
      logDebug('⚠ buffering');
      setIsLoading(true);
    });

    audio.addEventListener('canplay', () => {
      logDebug(`canplay: ready=${audio.readyState}`);
      setIsLoading(false);
    });

    audio.addEventListener('stalled', () => {
      logDebug('⚠ stalled');
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Update stream info based on current station and quality
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateStreamInfo = () => {
      const quality = getCurrentQuality();
      let channels = 'Stereo';
      let sampleRate = '48.0 kHz';

      // Use Audio Context API for sample rate detection
      if (window.AudioContext || window.webkitAudioContext) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContextClass();
          sampleRate = `${(audioContext.sampleRate / 1000).toFixed(1)} kHz`;
        } catch (e) {
          console.log('AudioContext not available:', e);
        }
      }

      setStreamInfo({
        format: quality.format,
        bitrate: quality.bitrate,
        channels,
        sampleRate
      });
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
      // Only set src and load if src is different or empty
      if (!audio.src || audio.src !== streamUrl) {
        logDebug(`Setting src: ${streamUrl}`);
        audio.src = streamUrl;
        audio.load(); // Explicitly load the stream
      }

      logDebug(`play() - paused=${audio.paused}, ready=${audio.readyState}`);
      setIsLoading(true);

      try {
        await audio.play();
        logDebug('✓ play() success');
      } catch (err) {
        logDebug(`✗ play() failed: ${err.message}`);
        setIsLoading(false);
      }
    } else {
      // Pause
      logDebug('pause()');
      audio.pause();
    }
  };

  const switchStation = async (station) => {
    if (isSwitchingRef.current || isSwitchingQualityRef.current || currentStation.id === station.id) {
      logDebug('⚠ Cannot switch station - operation in progress');
      return;
    }

    logDebug(`Switching to ${station.name}`);
    isSwitchingRef.current = true;

    const wasPlaying = isPlaying;
    const audio = audioRef.current;

    try {
      // Stop current playback and clear buffer
      if (audio) {
        audio.pause();
        audio.src = ''; // Clear old stream to prevent decode errors
        audio.load(); // Flush decoder pipeline

        // Wait longer for decoder to fully flush (especially for format changes)
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Update station
      setCurrentStation(station);
      setIsPlaying(false);

      logDebug('Station switched');

      // Autoplay if was playing before
      if (wasPlaying && audio) {
        logDebug('Autoplay after station switch');

        // Wait a bit more before starting new stream
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get URL for the new station's selected quality
        const qualityId = selectedQuality[station.id];
        const quality = station.qualities.find(q => q.id === qualityId) || station.qualities[0];

        // Set new src and play
        audio.src = quality.url;
        audio.load();
        setIsLoading(true);

        try {
          await audio.play();
          logDebug('✓ Autoplay success');
        } catch (err) {
          logDebug(`✗ Autoplay failed: ${err.message}`);
          setIsLoading(false);
        }
      }
    } catch (error) {
      logDebug(`✗ Switch error: ${error.message}`);
      setIsLoading(false);
    } finally {
      isSwitchingRef.current = false;
    }
  };

  // Switch quality for current station
  const switchQuality = async (qualityId) => {
    if (selectedQuality[currentStation.id] === qualityId) {
      return; // Already selected
    }

    if (isSwitchingRef.current || isSwitchingQualityRef.current) {
      logDebug('⚠ Cannot switch quality - operation in progress');
      return;
    }

    logDebug(`Switching quality to ${qualityId}`);
    isSwitchingQualityRef.current = true;

    try {
      // Update selected quality
      setSelectedQuality(prev => ({
        ...prev,
        [currentStation.id]: qualityId
      }));

      // If currently playing, restart with new quality
      const audio = audioRef.current;
      if (isPlaying && audio) {
        const quality = currentStation.qualities.find(q => q.id === qualityId);
        if (quality) {
          logDebug(`Reloading stream with new quality: ${quality.url}`);

          // Pause and clear to prevent decode errors when switching formats
          audio.pause();
          audio.src = '';
          audio.load();

          // Wait longer for decoder to fully flush (format changes need more time)
          await new Promise(resolve => setTimeout(resolve, 300));

          // Now set new quality stream
          audio.src = quality.url;
          audio.load();
          setIsLoading(true);

          // Wait a bit before playing
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            await audio.play();
            logDebug('✓ Quality switch success');
          } catch (err) {
            logDebug(`✗ Quality switch failed: ${err.message}`);
            setIsLoading(false);
          }
        }
      }
    } finally {
      isSwitchingQualityRef.current = false;
    }
  };

  // Functions to pause/resume radio from article audio players
  const pauseRadio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      return true; // Return true if we paused
    }
    return false;
  };

  // Aggressive stop for mobile - fully releases audio focus
  const stopRadio = () => {
    if (audioRef.current) {
      const wasSrc = audioRef.current.src;
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear source to release audio session
      return wasSrc; // Return old src so it can be restored
    }
    return null;
  };

  const resumeRadio = () => {
    if (audioRef.current && !isPlaying && audioRef.current.src) {
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
    switchQuality,
    pauseRadio,
    stopRadio,
    resumeRadio,
    restoreRadio
  };

  // Split-screen layout for screens larger than small tablet portrait (768px+)
  const showSplitScreen = device.screenWidth >= 768;

  return (
    <DeviceContext.Provider value={device}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteHandler>
          <div className="min-h-screen bg-bg-primary">
          {showSplitScreen ? (
            // Desktop/TV: Radio-focused layout with optional news
            <div className={`flex items-center justify-center min-h-screen relative overflow-hidden ${
              !showNews && isPlaying && settings.backgroundAnimation === 'minimal' ? 'animated-gradient' :
              settings.backgroundAnimation === 'none' ? 'bg-bg-secondary' : 'bg-bg-secondary'
            }`}>
              {/* Weather Background - Full screen behind everything */}
              {settings.backgroundAnimation === 'weather' && !showNews && isPlaying && (
                <WeatherBackground />
              )}
              {/* Top Right Buttons */}
              <div className="absolute top-6 right-6 z-50 flex gap-3">
                {/* Settings Button */}
                <motion.button
                  onClick={() => setShowSettingsModal(true)}
                  className="w-12 h-12 rounded-lg bg-bg-tertiary/80 hover:bg-bg-tertiary border border-bg-primary transition-all flex items-center justify-center backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Settings"
                >
                  <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.button>

                {/* Toggle News Button - Minimalistic Hamburger */}
                <motion.button
                  onClick={() => setShowNews(!showNews)}
                  className="w-12 h-12 rounded-lg bg-bg-tertiary/80 hover:bg-bg-tertiary border border-bg-primary transition-all flex items-center justify-center backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={showNews ? 'Hide news' : 'Show news'}
                >
                  {showNews ? (
                    // X icon
                    <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    // Hamburger icon
                    <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </motion.button>
              </div>

              {/* Content Container - Always 16:9 aspect ratio */}
              <div className="w-full h-screen flex overflow-hidden transition-all duration-500 max-w-[177.78vh]">
                {/* Radio Section */}
                <div
                  className={`overflow-hidden relative flex items-center justify-center transition-all duration-500 ${
                    showNews ? 'w-[35%] border-r border-border' : 'w-full'
                  }`}
                >
                  {/* Floating particles animation - only show for minimal background */}
                  {!showNews && isPlaying && settings.backgroundAnimation === 'minimal' && (
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

                  {/* Radio Player - Always centered */}
                  <Radio radioState={radioState} />

                  {/* Weather Card - Bottom left corner, only show when not in news mode */}
                  {!showNews && isPlaying && settings.backgroundAnimation === 'weather' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute bottom-6 left-6 z-20"
                    >
                      <WeatherCard />
                    </motion.div>
                  )}
                </div>

                {/* News Section - Slide in from right */}
                <AnimatePresence>
                  {showNews && (
                    <motion.div
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className="flex-1 overflow-y-auto scrollbar-hide relative flex items-center justify-center bg-bg-secondary"
                    >
                      <News radioState={radioState} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            // Mobile/Tablet: Single page with routing
            <>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Radio radioState={radioState} />} />
                  <Route path="/news" element={<News radioState={radioState} />} />
                </Routes>
              </AnimatePresence>
              <BottomNav />
            </>
          )}
        </div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
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
