import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import Radio from './pages/Radio';
import News from './pages/News';
import BottomNav from './components/BottomNav';

const STATIONS = [
  {
    id: 'fm',
    name: 'Radio Constanța FM',
    coverArt: '/rcfm.png',
    color: 'from-blue-500/20 to-cyan-500/20',
    qualities: [
      { id: '128', name: 'MP3 128 kbps', url: 'https://radio.turlacu.workers.dev/?station=fm128', format: 'MP3', bitrate: '128 kbps' },
      { id: '256', name: 'MP3 256 kbps', url: 'https://radio.turlacu.workers.dev/?station=fm256', format: 'MP3', bitrate: '256 kbps' }
    ]
  },
  {
    id: 'folclor',
    name: 'Radio Constanța Folclor',
    coverArt: '/rcf.png',
    color: 'from-purple-500/20 to-pink-500/20',
    qualities: [
      { id: '128', name: 'MP3 128 kbps', url: 'https://radio.turlacu.workers.dev/?station=folclor128', format: 'MP3', bitrate: '128 kbps' },
      { id: '256', name: 'MP3 256 kbps', url: 'https://radio.turlacu.workers.dev/?station=folclor256', format: 'MP3', bitrate: '256 kbps' }
    ]
  }
];

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState(STATIONS[0]);
  const [currentQuality, setCurrentQuality] = useState(STATIONS[0].qualities[0]);
  const [metadata, setMetadata] = useState('');
  const [streamInfo, setStreamInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState(''); // For mobile debugging
  const audioRef = useRef(null);
  const isSwitchingRef = useRef(false);

  // Helper to log debug info visibly on mobile
  const logDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => `${new Date().toLocaleTimeString()}: ${message}\n${prev}`.substring(0, 500));
  };

  // Create Audio element (HTML5 approach - mobile friendly)
  useEffect(() => {
    // Create audio element and append to document
    const audio = document.createElement('audio');
    audio.preload = 'none';
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

  // Update stream info based on selected quality
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateStreamInfo = () => {
      let channels = 'Stereo';
      let sampleRate = '44.1 kHz';

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
        format: currentQuality.format,
        bitrate: currentQuality.bitrate,
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
  }, [currentQuality]);

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio || !currentQuality.url) {
      logDebug('No audio or URL');
      return;
    }

    // If paused, start playing
    if (audio.paused) {
      // Always set src and load before playing
      logDebug(`Setting src: ${currentQuality.url}`);
      audio.src = currentQuality.url;
      audio.load(); // Explicitly load the stream

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

  const switchStation = (station) => {
    if (isSwitchingRef.current || currentStation.id === station.id) {
      return;
    }

    logDebug(`Switching to ${station.name}`);
    isSwitchingRef.current = true;

    try {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Update station and quality
      setCurrentStation(station);
      const defaultQuality = station.qualities[0];
      setCurrentQuality(defaultQuality);
      setIsPlaying(false);

      logDebug('Station switched - press Play to start');
    } catch (error) {
      logDebug(`✗ Switch error: ${error.message}`);
    } finally {
      isSwitchingRef.current = false;
    }
  };

  const switchQuality = (quality) => {
    if (isSwitchingRef.current || currentQuality.id === quality.id) {
      return;
    }

    logDebug(`Switching to ${quality.name}`);
    isSwitchingRef.current = true;

    try {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Update quality
      setCurrentQuality(quality);
      setIsPlaying(false);

      logDebug('Quality switched - press Play to start');
    } catch (error) {
      logDebug(`✗ Quality switch error: ${error.message}`);
    } finally {
      isSwitchingRef.current = false;
    }
  };

  const radioState = {
    isPlaying,
    isLoading,
    currentStation,
    currentQuality,
    metadata,
    streamInfo,
    stations: STATIONS,
    debugInfo,
    togglePlay,
    switchStation,
    switchQuality
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-surface">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Radio radioState={radioState} />} />
            <Route path="/news" element={<News radioState={radioState} />} />
          </Routes>
        </AnimatePresence>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
