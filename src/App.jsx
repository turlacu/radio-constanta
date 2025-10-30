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
      { id: '128', name: 'MP3 128 kbps', url: 'https://stream4.srr.ro:8443/radio-constanta-fm', format: 'MP3', bitrate: '128 kbps' },
      { id: 'flac', name: 'FLAC', url: 'https://stream4.srr.ro:8443/radio-constanta-fm', format: 'FLAC', bitrate: '128 kbps' }
    ]
  },
  {
    id: 'folclor',
    name: 'Radio Constanța Folclor',
    coverArt: '/rcf.png',
    color: 'from-purple-500/20 to-pink-500/20',
    qualities: [
      { id: '128', name: 'MP3 128 kbps', url: 'https://stream4.srr.ro:8443/radio-constanta-am', format: 'MP3', bitrate: '128 kbps' }
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
  const playAttemptRef = useRef(false);

  // Helper to log debug info visibly on mobile
  const logDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => `${new Date().toLocaleTimeString()}: ${message}\n${prev}`.substring(0, 500));
  };

  // React handles src updates via audio element prop, no need for useEffect

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
    logDebug(`togglePlay: isPlaying=${isPlaying}, isLoading=${isLoading}`);

    // Prevent double-clicks with ref
    if (playAttemptRef.current) {
      logDebug('Play attempt in progress, ignoring');
      return;
    }

    if (!currentQuality.url) {
      logDebug('ERROR: No URL');
      return;
    }

    if (isPlaying) {
      logDebug('Pausing');
      audioRef.current?.pause();
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    // Start play attempt
    playAttemptRef.current = true;
    setIsLoading(true);
    logDebug('Starting playback...');

    try {
      if (!audioRef.current) {
        throw new Error('Audio element not found');
      }

      logDebug(`Calling play() on: ${currentQuality.url}`);

      // Call play() - don't await, just initiate
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        // Handle promise but don't block on it
        playPromise
          .then(() => {
            logDebug('✓ Play promise resolved');
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            logDebug(`✗ Play promise rejected: ${err.message}`);
            setIsPlaying(false);
            setIsLoading(false);
          });
      }

      // Assume success immediately for mobile
      logDebug('✓ Play initiated, assuming success');
      setIsPlaying(true);

      // Clear loading after brief delay
      setTimeout(() => {
        setIsLoading(false);
        logDebug(`Playing check: paused=${audioRef.current?.paused}`);
      }, 500);

    } catch (error) {
      logDebug(`✗ ${error.name}: ${error.message}`);
      setIsPlaying(false);
      setIsLoading(false);
    } finally {
      playAttemptRef.current = false;
    }
  };

  const switchStation = async (station) => {
    // Prevent switching if already switching or same station
    if (isSwitchingRef.current || currentStation.id === station.id) {
      console.log('Already switching or same station, ignoring...');
      return;
    }

    console.log('Switching to station:', station.name);
    isSwitchingRef.current = true;
    setIsLoading(true);
    setIsPlaying(false);

    try {
      // Pause and reset current stream
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log('Paused current stream');
      }

      // Switch to new station and set default quality (128 kbps)
      setCurrentStation(station);
      const defaultQuality = station.qualities[0];
      setCurrentQuality(defaultQuality);

      // Load and play new station
      if (defaultQuality.url && audioRef.current) {
        console.log('Setting new stream URL:', defaultQuality.url);
        audioRef.current.src = defaultQuality.url;
        audioRef.current.load(); // Explicitly load the new stream

        // Wait for the stream to be ready with retry logic
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          try {
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Timeout')), 8000);

              const onCanPlay = () => {
                clearTimeout(timeout);
                audioRef.current?.removeEventListener('canplay', onCanPlay);
                audioRef.current?.removeEventListener('error', onError);
                resolve();
              };

              const onError = (e) => {
                clearTimeout(timeout);
                audioRef.current?.removeEventListener('canplay', onCanPlay);
                audioRef.current?.removeEventListener('error', onError);
                reject(new Error('Audio load error'));
              };

              audioRef.current?.addEventListener('canplay', onCanPlay, { once: true });
              audioRef.current?.addEventListener('error', onError, { once: true });
            });

            // Now play
            console.log('Attempting to play...');
            await audioRef.current.play();
            console.log('Playback started successfully');
            setIsPlaying(true);
            break; // Success, exit retry loop
          } catch (playError) {
            retryCount++;
            if (retryCount > maxRetries) {
              throw playError; // Give up after max retries
            }
            console.log(`Retry ${retryCount}/${maxRetries} after error:`, playError.message);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
            // Reload the audio
            audioRef.current?.load();
          }
        }
      }
    } catch (error) {
      console.error('Error switching station:', error);
      setIsPlaying(false);
      // Only show alert for real errors, not interruption errors
      const errorMessage = error?.message || error?.type || '';
      if (!errorMessage.includes('interrupted') && !errorMessage.includes('Timeout') && !errorMessage.includes('abort')) {
        alert('Nu s-a putut reda stația. Verificați conexiunea la internet.');
      }
    } finally {
      setIsLoading(false);
      isSwitchingRef.current = false;
    }
  };

  const switchQuality = async (quality) => {
    // Prevent switching if already switching
    if (isSwitchingRef.current) {
      console.log('Already switching, ignoring...');
      return;
    }

    console.log('Switching to quality:', quality.name);
    isSwitchingRef.current = true;
    const wasPlaying = isPlaying;
    setIsLoading(true);
    setIsPlaying(false);

    try {
      // Pause current stream
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log('Paused current stream');
      }

      // Switch quality
      setCurrentQuality(quality);

      // Load and play new quality if was playing
      if (quality.url && audioRef.current) {
        console.log('Setting new stream URL:', quality.url);
        audioRef.current.src = quality.url;
        audioRef.current.load();

        if (wasPlaying) {
          // Wait for the stream to be ready with retry logic
          let retryCount = 0;
          const maxRetries = 2;

          while (retryCount <= maxRetries) {
            try {
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 8000);

                const onCanPlay = () => {
                  clearTimeout(timeout);
                  audioRef.current?.removeEventListener('canplay', onCanPlay);
                  audioRef.current?.removeEventListener('error', onError);
                  resolve();
                };

                const onError = (e) => {
                  clearTimeout(timeout);
                  audioRef.current?.removeEventListener('canplay', onCanPlay);
                  audioRef.current?.removeEventListener('error', onError);
                  reject(new Error('Audio load error'));
                };

                audioRef.current?.addEventListener('canplay', onCanPlay, { once: true });
                audioRef.current?.addEventListener('error', onError, { once: true });
              });

              // Now play
              console.log('Attempting to play...');
              await audioRef.current.play();
              console.log('Playback started successfully');
              setIsPlaying(true);
              break; // Success, exit retry loop
            } catch (playError) {
              retryCount++;
              if (retryCount > maxRetries) {
                throw playError; // Give up after max retries
              }
              console.log(`Retry ${retryCount}/${maxRetries} after error:`, playError.message);
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
              // Reload the audio
              audioRef.current?.load();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error switching quality:', error);
      setIsPlaying(false);
      const errorMessage = error?.message || error?.type || '';
      if (!errorMessage.includes('interrupted') && !errorMessage.includes('Timeout') && !errorMessage.includes('abort')) {
        alert('Nu s-a putut schimba calitatea. Verificați conexiunea la internet.');
      }
    } finally {
      setIsLoading(false);
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
        <audio
          ref={audioRef}
          src={currentQuality.url}
          preload="none"
          onError={() => {
            logDebug('Audio element error event');
            setIsLoading(false);
            setIsPlaying(false);
          }}
        />
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
