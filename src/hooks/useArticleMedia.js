import { useEffect, useState } from 'react';

/**
 * Custom hook for handling article audio and video players
 *
 * Manages the interaction between article media (audio/video) and radio playback:
 * - Pauses radio when article media plays
 * - Resumes radio when article media stops
 * - Handles iOS/mobile video playback restrictions
 * - Creates custom video controls overlay
 *
 * @param {string} fullContent - HTML content of the article
 * @param {object} radioState - Radio player state with pause/resume methods
 * @returns {void}
 */
export function useArticleMedia(fullContent, radioState) {
  const [radioPausedByArticle, setRadioPausedByArticle] = useState(false);
  const [savedRadioSrc, setSavedRadioSrc] = useState(null);

  useEffect(() => {
    if (!radioState || !fullContent) return;

    // Wait for content to be rendered
    const timer = setTimeout(() => {
      // Find all audio and video elements in the article content
      const audioElements = document.querySelectorAll('article audio.wp-audio-shortcode');
      const videoElements = document.querySelectorAll('article video');
      const mediaElements = [...audioElements, ...videoElements];

      if (mediaElements.length === 0) return;

      const cleanupFunctions = [];

      mediaElements.forEach((media) => {
        // Configure video elements with custom controls
        if (media.tagName === 'VIDEO') {
          // Skip if already configured
          if (media.getAttribute('data-video-configured') === 'true') {
            return;
          }

          // iOS/mobile playback attributes (no native controls)
          media.setAttribute('playsinline', 'true');
          media.setAttribute('webkit-playsinline', 'true');
          media.setAttribute('x-webkit-airplay', 'allow');
          media.setAttribute('preload', 'metadata');
          media.removeAttribute('controls');
          media.removeAttribute('width');
          media.removeAttribute('height');

          // Extract video source
          let videoSrc = media.src || media.currentSrc;
          if (!videoSrc) {
            const sourceElements = media.querySelectorAll('source');
            if (sourceElements.length > 0) {
              videoSrc = sourceElements[0].src;
            }
          }

          if (!videoSrc) return;

          // Set src directly and store as data attribute
          media.src = videoSrc;
          media.setAttribute('src', videoSrc);
          media.setAttribute('data-video-src', videoSrc);

          // Remove source elements to prevent conflicts
          media.querySelectorAll('source').forEach((s) => s.remove());
          media.load();
          media.setAttribute('data-video-configured', 'true');

          // Create custom controls wrapper
          const wrapper = document.createElement('div');
          wrapper.style.cssText = `
            position: relative;
            width: 100%;
            display: block;
            margin: 1rem 0;
          `;

          media.parentElement.insertBefore(wrapper, media);
          wrapper.appendChild(media);

          media.style.display = 'block';
          media.style.width = '100%';
          media.style.height = 'auto';

          // Create controls overlay
          const controlsOverlay = document.createElement('div');
          controlsOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: opacity 0.3s;
            z-index: 10;
          `;

          // Create play button
          const playButton = document.createElement('div');
          playButton.style.cssText = `
            width: 80px;
            height: 80px;
            background: rgba(0, 191, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            transition: transform 0.2s, background 0.2s;
            pointer-events: auto;
          `;
          playButton.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          `;

          controlsOverlay.appendChild(playButton);
          wrapper.appendChild(controlsOverlay);

          let isVideoPlaying = false;

          const updateControlsVisibility = () => {
            controlsOverlay.style.opacity = isVideoPlaying ? '0' : '1';
            controlsOverlay.style.pointerEvents = isVideoPlaying ? 'none' : 'auto';
          };

          // Handle play/pause
          const handlePlayPause = async () => {
            if (media.paused) {
              // Recover src if missing
              if (!media.src && !media.currentSrc) {
                const storedSrc = media.getAttribute('data-video-src');
                if (storedSrc) {
                  media.src = storedSrc;
                  media.setAttribute('src', storedSrc);
                  media.load();
                }
              }

              // Muted video strategy for mobile when radio is playing
              if (radioState.isPlaying) {
                media.muted = true;
                try {
                  await media.play();
                  isVideoPlaying = true;
                  playButton.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  `;
                  updateControlsVisibility();

                  // Stop radio and save src
                  const radioSrc = radioState.stopRadio();
                  setSavedRadioSrc(radioSrc);
                  setRadioPausedByArticle(true);

                  // Unmute after audio context settles
                  setTimeout(() => {
                    media.muted = false;
                  }, 200);
                } catch (err) {
                  console.error('Video play failed:', err);
                  media.muted = false;
                }
              } else {
                // Radio not playing - play normally
                try {
                  await media.play();
                  isVideoPlaying = true;
                  playButton.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  `;
                  updateControlsVisibility();
                } catch (err) {
                  console.error('Video play failed:', err);
                }
              }
            } else {
              media.pause();
              isVideoPlaying = false;
              playButton.innerHTML = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              `;
              updateControlsVisibility();
            }
          };

          controlsOverlay.addEventListener('click', handlePlayPause);
          media.addEventListener('click', handlePlayPause);

          media.addEventListener('ended', () => {
            isVideoPlaying = false;
            playButton.innerHTML = `
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            `;
            updateControlsVisibility();
          });

          // Show controls on hover (desktop)
          media.addEventListener('mouseenter', () => {
            if (isVideoPlaying) controlsOverlay.style.opacity = '0.7';
          });
          media.addEventListener('mouseleave', () => {
            if (isVideoPlaying) controlsOverlay.style.opacity = '0';
          });

          cleanupFunctions.push(() => {
            controlsOverlay.remove();
          });
        }

        // Audio/Video play handler
        const handlePlay = () => {
          const wasPaused = radioState.pauseRadio();
          if (wasPaused) {
            setRadioPausedByArticle(true);
          }
        };

        // Audio/Video end/pause handler
        const handleEnded = () => {
          if (radioPausedByArticle) {
            if (savedRadioSrc) {
              radioState.restoreRadio(savedRadioSrc);
              setSavedRadioSrc(null);
              setTimeout(() => radioState.resumeRadio(), 100);
            } else {
              radioState.resumeRadio();
            }
            setRadioPausedByArticle(false);
          }
        };

        const handlePause = () => {
          if (radioPausedByArticle) {
            if (savedRadioSrc) {
              radioState.restoreRadio(savedRadioSrc);
              setSavedRadioSrc(null);
              setTimeout(() => radioState.resumeRadio(), 100);
            } else {
              radioState.resumeRadio();
            }
            setRadioPausedByArticle(false);
          }
        };

        media.addEventListener('play', handlePlay);
        media.addEventListener('ended', handleEnded);
        media.addEventListener('pause', handlePause);

        cleanupFunctions.push(() => {
          media.removeEventListener('play', handlePlay);
          media.removeEventListener('ended', handleEnded);
          media.removeEventListener('pause', handlePause);
        });
      });

      return () => {
        cleanupFunctions.forEach((cleanup) => cleanup());
      };
    }, 500);

    return () => clearTimeout(timer);
  }, [fullContent, radioState, radioPausedByArticle, savedRadioSrc]);
}
