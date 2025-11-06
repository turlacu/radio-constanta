import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, createContext } from 'react';
import Radio from './pages/Radio';
import News from './pages/News';
import BottomNav from './components/BottomNav';
import { useDeviceDetection } from './hooks/useDeviceDetection';

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

function App() {
  // Device detection
  const device = useDeviceDetection();

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

        // Wait for decoder to fully flush (FLAC needs more time than MP3)
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Update station
      setCurrentStation(station);
      setIsPlaying(false);

      logDebug('Station switched');

      // Autoplay if was playing before
      if (wasPlaying && audio) {
        logDebug('Autoplay after station switch');

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

          // Wait for decoder to fully flush (FLAC needs more time than MP3)
          await new Promise(resolve => setTimeout(resolve, 150));

          // Now set new quality stream
          audio.src = quality.url;
          audio.load();
          setIsLoading(true);

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
    stations: Object.values(STATIONS), // Convert to array for compatibility
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
        <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-surface">
          {showSplitScreen ? (
            // Desktop/TV: Split-screen layout (both pages visible)
            <div className="flex h-screen overflow-hidden">
              {/* Radio Section - Left (45% width, centered content) */}
              <div className="w-[45%] overflow-hidden relative">
                <Radio radioState={radioState} />
              </div>

              {/* Vertical grey divider */}
              <div className="w-[1px] bg-white/10 flex-shrink-0" />

              {/* News Section - Right (55% width, more space for articles) */}
              <div className="flex-1 overflow-y-auto scrollbar-hide relative">
                <News radioState={radioState} />
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
      </Router>
    </DeviceContext.Provider>
  );
}

export default App;
