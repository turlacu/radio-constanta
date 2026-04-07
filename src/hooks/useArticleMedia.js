import { useEffect, useRef } from 'react';

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
  const radioStateRef = useRef(radioState);
  const radioPausedByArticleRef = useRef(false);
  const savedRadioSrcRef = useRef(null);

  useEffect(() => {
    radioStateRef.current = radioState;
  }, [radioState]);

  useEffect(() => {
    if (!fullContent) return;

    let cleanupFunctions = [];

    const pauseRadioForArticle = (releaseAudioFocus = false) => {
      const currentRadioState = radioStateRef.current;
      if (!currentRadioState || radioPausedByArticleRef.current) {
        return;
      }

      if (releaseAudioFocus && currentRadioState.isPlaying) {
        const radioSrc = currentRadioState.stopRadio();
        savedRadioSrcRef.current = radioSrc;
        radioPausedByArticleRef.current = Boolean(radioSrc);
        return;
      }

      const wasPaused = currentRadioState.pauseRadio();
      if (wasPaused) {
        radioPausedByArticleRef.current = true;
      }
    };

    const resumeRadioIfNeeded = () => {
      const currentRadioState = radioStateRef.current;
      if (!currentRadioState || !radioPausedByArticleRef.current) {
        return;
      }

      if (savedRadioSrcRef.current) {
        currentRadioState.restoreRadio(savedRadioSrcRef.current);
        savedRadioSrcRef.current = null;
        setTimeout(() => currentRadioState.resumeRadio(), 100);
      } else {
        currentRadioState.resumeRadio();
      }

      radioPausedByArticleRef.current = false;
    };

    const timer = setTimeout(() => {
      const audioElements = document.querySelectorAll('article audio.wp-audio-shortcode');
      const videoElements = document.querySelectorAll('article video');
      const mediaElements = [...audioElements, ...videoElements];

      if (mediaElements.length === 0) return;

      mediaElements.forEach((media) => {
        if (media.tagName === 'VIDEO') {
          if (media.getAttribute('data-video-configured') !== 'true') {
            media.setAttribute('playsinline', 'true');
            media.setAttribute('webkit-playsinline', 'true');
            media.setAttribute('x-webkit-airplay', 'allow');
            media.setAttribute('preload', 'metadata');
            media.removeAttribute('controls');
            media.removeAttribute('width');
            media.removeAttribute('height');

            let videoSrc = media.src || media.currentSrc;
            if (!videoSrc) {
              const sourceElements = media.querySelectorAll('source');
              if (sourceElements.length > 0) {
                videoSrc = sourceElements[0].src;
              }
            }

            if (!videoSrc) {
              return;
            }

            media.src = videoSrc;
            media.setAttribute('src', videoSrc);
            media.setAttribute('data-video-src', videoSrc);
            media.querySelectorAll('source').forEach((source) => source.remove());
            media.load();
            media.setAttribute('data-video-configured', 'true');

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

            const handlePlayPause = async () => {
              const currentRadioState = radioStateRef.current;

              if (media.paused) {
                if (!media.src && !media.currentSrc) {
                  const storedSrc = media.getAttribute('data-video-src');
                  if (storedSrc) {
                    media.src = storedSrc;
                    media.setAttribute('src', storedSrc);
                    media.load();
                  }
                }

                if (currentRadioState?.isPlaying) {
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
                    pauseRadioForArticle(true);

                    setTimeout(() => {
                      media.muted = false;
                    }, 200);
                  } catch (err) {
                    console.error('Video play failed:', err);
                    media.muted = false;
                  }
                } else {
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

            const handleVideoEnded = () => {
              isVideoPlaying = false;
              playButton.innerHTML = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              `;
              updateControlsVisibility();
            };

            const handleMouseEnter = () => {
              if (isVideoPlaying) controlsOverlay.style.opacity = '0.7';
            };

            const handleMouseLeave = () => {
              if (isVideoPlaying) controlsOverlay.style.opacity = '0';
            };

            controlsOverlay.addEventListener('click', handlePlayPause);
            media.addEventListener('click', handlePlayPause);
            media.addEventListener('ended', handleVideoEnded);
            media.addEventListener('mouseenter', handleMouseEnter);
            media.addEventListener('mouseleave', handleMouseLeave);

            cleanupFunctions.push(() => {
              controlsOverlay.removeEventListener('click', handlePlayPause);
              media.removeEventListener('click', handlePlayPause);
              media.removeEventListener('ended', handleVideoEnded);
              media.removeEventListener('mouseenter', handleMouseEnter);
              media.removeEventListener('mouseleave', handleMouseLeave);
              controlsOverlay.remove();
            });
          }
        }

        const handlePlay = () => {
          if (!radioPausedByArticleRef.current) {
            pauseRadioForArticle(false);
          }
        };

        const handleEnded = () => {
          resumeRadioIfNeeded();
        };

        const handlePause = () => {
          resumeRadioIfNeeded();
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
    }, 500);

    return () => {
      clearTimeout(timer);
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [fullContent]);
}
