import { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import NewsList from '../components/NewsList';
import NewsArticle from '../components/NewsArticle';
import NewsHeader from '../components/NewsHeader';
import Loader from '../components/Loader';
import { fetchNews } from '../utils/fetchNews';
import { DeviceContext } from '../App';

export default function News({ radioState }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.policy?.canShowNewsRail;
  const rootRef = useRef(null);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialNews();
  }, []);

  useEffect(() => {
    const findScrollContainer = (node) => {
      let current = node?.parentElement || null;

      while (current) {
        const style = window.getComputedStyle(current);
        const isScrollable = /(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight;

        if (isScrollable) {
          return current;
        }

        current = current.parentElement;
      }

      return window;
    };

    const target = findScrollContainer(rootRef.current);
    setScrollTarget(target);
  }, [isSplitScreen]);

  useEffect(() => {
    if (!scrollTarget) return;

    const handleScroll = () => {
      const top = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
      setShowBackToTop(top > 220);
    };

    handleScroll();
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [scrollTarget]);

  const scrollToTop = () => {
    if (!scrollTarget) return;

    if (scrollTarget === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadInitialNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNews(1, 20);
      setArticles(data.articles);
      setHasMore(data.hasMore);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreNews = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await fetchNews(nextPage, 20);
      setArticles([...articles, ...data.articles]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="
        flex items-center justify-center
        min-app-height
      ">
        <Loader size="large" text="Se încarcă știrile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="
        flex flex-col items-center justify-center text-center
        min-app-height
        px-[clamp(1rem,0.88rem+0.5vw,3rem)]
      ">
        <svg className="
          mb-[clamp(0.9rem,0.78rem+0.45vw,1.5rem)] h-[clamp(3.5rem,3rem+1.5vw,7rem)] w-[clamp(3.5rem,3rem+1.5vw,7rem)] text-white/30
        " fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="
          mb-[clamp(0.4rem,0.34rem+0.2vw,0.75rem)] font-semibold
          text-[clamp(1.35rem,1.1rem+0.95vw,2.75rem)]
        ">Oops!</h2>
        <p className="
          mb-[clamp(1.25rem,1rem+0.8vw,2rem)] text-white/60
          text-[clamp(0.95rem,0.85rem+0.35vw,1.45rem)]
        ">{error}</p>
        <button
          onClick={loadInitialNews}
          className="
            bg-primary hover:bg-primary/90 rounded-2xl font-medium transition-colors tv-focusable
            px-[clamp(1.15rem,0.95rem+0.7vw,3rem)] py-[clamp(0.7rem,0.6rem+0.35vw,1.5rem)] text-[clamp(0.95rem,0.86rem+0.28vw,1.35rem)]
          "
          tabIndex={0}
        >
          Încearcă din nou
        </button>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <NewsArticle
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        radioState={radioState}
        isSplitScreen={isSplitScreen}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      className={
      isSplitScreen
        ? "h-full w-full relative flex flex-col" // Split-screen: fill entire section with background and use flex layout
        : "min-app-height relative overflow-hidden" // Single page: full screen
      }
    >
      {/* Subtle ambient glow accents */}
      {isSplitScreen ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl opacity-60" />
        </div>
      ) : (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
      )}

      <NewsHeader isSplitScreen={isSplitScreen} />

      {/* News List */}
      <div className="relative">
        <NewsList
          articles={articles}
          onArticleClick={setSelectedArticle}
          onLoadMore={loadMoreNews}
          hasMore={hasMore}
          loading={loadingMore}
          isSplitScreen={isSplitScreen}
        />
      </div>

      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-bg-tertiary/90 text-white shadow-[0_12px_28px_rgba(2,6,23,0.3)] backdrop-blur-lg transition-colors hover:bg-bg-tertiary"
          aria-label="Back to top"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
