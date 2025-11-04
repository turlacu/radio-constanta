import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Loader from './Loader';

export default function NewsArticle({ article, onBack, radioState }) {
  const [fullContent, setFullContent] = useState(article.content || '');
  const [fullImage, setFullImage] = useState(article.image);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radioPausedByArticle, setRadioPausedByArticle] = useState(false);
  const [savedRadioSrc, setSavedRadioSrc] = useState(null);

  if (!article) return null;

  // Fetch full article content when component mounts
  useEffect(() => {
    const fetchFullArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching full article from:', article.link);

        const response = await fetch(`/api/article?url=${encodeURIComponent(article.link)}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch article: ${response.status}`);
        }

        const data = await response.json();

        console.log('Article data received:', data);

        if (data.content) {
          setFullContent(data.content);
          console.log('Full content set, length:', data.content.length);
        } else {
          console.warn('No content in response');
        }

        if (data.image) {
          setFullImage(data.image);
        }
      } catch (err) {
        console.error('Error fetching full article:', err);
        setError('Nu s-a putut încărca articolul complet. Click pe linkul de mai jos pentru a citi pe site.');
      } finally {
        setLoading(false);
      }
    };

    fetchFullArticle();
  }, [article.link]);

  // Handle article audio and video players - pause radio when playing, resume when done
  useEffect(() => {
    if (!radioState || !fullContent) return;

    // Wait a bit for content to be rendered
    const timer = setTimeout(() => {
      // Find all audio and video elements in the article content
      const audioElements = document.querySelectorAll('article audio.wp-audio-shortcode');
      const videoElements = document.querySelectorAll('article video');
      const mediaElements = [...audioElements, ...videoElements];

      if (mediaElements.length === 0) return;

      const cleanupFunctions = [];

      mediaElements.forEach((media) => {
        // Add mobile-friendly attributes to videos
        if (media.tagName === 'VIDEO') {
          // iOS/mobile playback attributes
          media.setAttribute('playsinline', 'true');
          media.setAttribute('webkit-playsinline', 'true');
          media.setAttribute('x-webkit-airplay', 'allow');
          media.setAttribute('preload', 'metadata');
          media.setAttribute('controls', 'controls');

          // Remove any width/height attributes that might interfere
          media.removeAttribute('width');
          media.removeAttribute('height');

          // Force reload with new attributes
          media.load();

          // Log for debugging
          console.log('Video configured for mobile:', media.src);

          // Handle video errors
          const handleError = (e) => {
            console.error('Video error:', e, media.error);
          };
          media.addEventListener('error', handleError);

          // CRITICAL FIX for mobile: Override play() method to coordinate with radio
          // This intercepts play BEFORE browser blocking logic runs
          const originalPlay = media.play.bind(media);
          let isCoordinating = false;

          media.play = function() {
            // If radio is playing and we haven't started coordinating yet
            if (radioState.isPlaying && !isCoordinating) {
              console.log('Video play() called while radio playing - coordinating audio focus');
              isCoordinating = true;

              // Stop radio immediately (synchronous, still in user gesture)
              const radioSrc = radioState.stopRadio();
              setSavedRadioSrc(radioSrc);
              setRadioPausedByArticle(true);
              console.log('Radio stopped - audio focus released');

              // Return promise that resolves after audio context is released
              return new Promise((resolve, reject) => {
                // Wait for audio session to fully release on mobile
                setTimeout(() => {
                  console.log('Calling original video play() after radio stopped');
                  originalPlay()
                    .then(() => {
                      console.log('✓ Video playing successfully');
                      isCoordinating = false;
                      resolve();
                    })
                    .catch(err => {
                      console.error('✗ Video play failed:', err);
                      isCoordinating = false;
                      // Restore radio if video failed
                      if (radioSrc) {
                        radioState.restoreRadio(radioSrc);
                        setSavedRadioSrc(null);
                        setRadioPausedByArticle(false);
                      }
                      reject(err);
                    });
                }, 300); // Give mobile time to release audio focus
              });
            }

            // If radio not playing or already coordinating, just call original play
            return originalPlay();
          };

          cleanupFunctions.push(() => {
            media.removeEventListener('error', handleError);
            // Restore original play method
            media.play = originalPlay;
          });
        }

        // When article media starts playing
        const handlePlay = () => {
          console.log('Article media playing - pausing radio');
          const wasPaused = radioState.pauseRadio();
          if (wasPaused) {
            setRadioPausedByArticle(true);
          }
        };

        // When article media ends or pauses
        const handleEnded = () => {
          console.log('Article media ended - resuming radio');
          if (radioPausedByArticle) {
            // Restore radio src if it was cleared for video playback
            if (savedRadioSrc) {
              radioState.restoreRadio(savedRadioSrc);
              setSavedRadioSrc(null);
              // Wait a moment then resume playback
              setTimeout(() => {
                radioState.resumeRadio();
              }, 100);
            } else {
              radioState.resumeRadio();
            }
            setRadioPausedByArticle(false);
          }
        };

        const handlePause = () => {
          console.log('Article media paused - resuming radio');
          if (radioPausedByArticle) {
            // Restore radio src if it was cleared for video playback
            if (savedRadioSrc) {
              radioState.restoreRadio(savedRadioSrc);
              setSavedRadioSrc(null);
              // Wait a moment then resume playback
              setTimeout(() => {
                radioState.resumeRadio();
              }, 100);
            } else {
              radioState.resumeRadio();
            }
            setRadioPausedByArticle(false);
          }
        };

        media.addEventListener('play', handlePlay);
        media.addEventListener('ended', handleEnded);
        media.addEventListener('pause', handlePause);

        // Store cleanup function
        cleanupFunctions.push(() => {
          media.removeEventListener('play', handlePlay);
          media.removeEventListener('ended', handleEnded);
          media.removeEventListener('pause', handlePause);
          if (handleVideoClick) {
            media.removeEventListener('click', handleVideoClick);
          }
        });
      });

      // Return cleanup function that cleans up all media elements
      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    }, 500);

    return () => clearTimeout(timer);
  }, [fullContent, radioState, radioPausedByArticle]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if article is older than 3 days
  const isOlderThanThreeDays = () => {
    const articleDate = new Date(article.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return articleDate < threeDaysAgo;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark-bg z-50 overflow-y-auto scrollbar-hide pb-20"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10">
        {/* Glassmorphic header background */}
        <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-xl border-b border-white/10" />

        <div className="relative flex items-center gap-4 px-4 py-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="relative w-10 h-10 rounded-full overflow-hidden group flex items-center justify-center"
          >
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-all group-hover:bg-white/15 group-hover:border-white/30" />

            <svg className="relative w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <h1 className="text-sm font-semibold text-white/90">Înapoi la știri</h1>
        </div>
      </div>

      {/* Article Content */}
      <article className="relative px-6 py-6 max-w-2xl mx-auto">
        {/* Featured Image */}
        {fullImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative w-full h-72 rounded-3xl overflow-hidden mb-6 shadow-2xl"
          >
            {/* Glassmorphic border effect */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-3xl z-10 pointer-events-none" />

            <img
              src={fullImage}
              alt={article.title}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x450/1A1A1A/00BFFF?text=Radio+Constanta';
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/60 via-transparent to-transparent" />
          </motion.div>
        )}

        {/* Category & Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-4 text-xs text-white/50 font-medium"
        >
          {article.category && (
            <>
              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold border border-primary/20">
                {article.category}
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
            </>
          )}
          <time>{formatDate(article.date)}</time>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-4 leading-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent"
        >
          {article.title}
        </motion.h1>

        {/* Summary - only show if full content hasn't loaded yet */}
        {article.summary && !fullContent && !loading && (
          <p className="text-lg text-white/70 mb-6 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Content */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size="medium" />
            <p className="text-white/60 text-sm mt-4">Se încarcă articolul complet...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm underline mt-2 inline-block"
            >
              Citește pe radioconstanta.ro
            </a>
          </div>
        )}

        {!loading && fullContent && (
          <div className="prose prose-invert max-w-none overflow-x-hidden">
            <div
              className="text-white/80 text-base leading-relaxed space-y-4 text-justify"
              dangerouslySetInnerHTML={{ __html: fullContent }}
            />
          </div>
        )}

        {/* Link to original - only show for articles older than 3 days */}
        {article.link && isOlderThanThreeDays() && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm mb-3">
              Acest articol are mai mult de 3 zile. Pentru informații actualizate, vizitează:
            </p>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              radioconstanta.ro
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </article>
    </motion.div>
  );
}
