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

  // Helper to log debug info visibly on mobile
  const logDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => `${new Date().toLocaleTimeString()}: ${message}\n${prev}`.substring(0, 500));
  };

  // Create Audio instance using JavaScript API
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    // Simple event handlers
    audio.onplay = () => {
      logDebug('✓ onplay fired');
      setIsPlaying(true);
      setIsLoading(false);
    };

    audio.onpause = () => {
      logDebug('onpause fired');
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.onerror = (e) => {
      const error = audio.error;
      logDebug(`✗ onerror: code=${error?.code}, msg=${error?.message}`);
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.onloadstart = () => {
      logDebug(`onloadstart: ready=${audio.readyState}, net=${audio.networkState}`);
    };

    audio.onloadeddata = () => {
      logDebug('onloadeddata: some data loaded');
    };

    audio.oncanplay = () => {
      logDebug(`oncanplay: ready=${audio.readyState}`);
      setIsLoading(false);
    };

    audio.onplaying = () => {
      logDebug('onplaying: playback started');
      setIsPlaying(true);
      setIsLoading(false);
    };

    audio.onstalled = () => {
      logDebug('⚠ onstalled: data fetch stalled');
    };

    audio.onsuspend = () => {
      logDebug('⚠ onsuspend: loading suspended');
    };

    audio.onwaiting = () => {
      logDebug('⚠ onwaiting: buffering');
    };

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

  const togglePlay = () => {
    const audio = audioRef.current;

    if (!audio || !currentQuality.url) {
      logDebug('No audio or URL');
      return;
    }

    // Set src if different
    if (audio.src !== currentQuality.url) {
      logDebug(`Setting src: ${currentQuality.url}`);
      audio.src = currentQuality.url;
    }

    // Toggle play/pause - simple and direct
    if (audio.paused) {
      logDebug(`play() called - paused=${audio.paused}, ready=${audio.readyState}`);
      setIsLoading(true);
      const playPromise = audio.play();

      // Log promise result for debugging
      if (playPromise) {
        playPromise
          .then(() => logDebug('play() promise resolved'))
          .catch(err => logDebug(`play() promise rejected: ${err.message}`));
      }
    } else {
      logDebug('pause() called');
      audio.pause();
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
