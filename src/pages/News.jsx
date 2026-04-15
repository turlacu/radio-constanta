import { useState, useEffect, useContext } from 'react';
import NewsList from '../components/NewsList';
import NewsArticle from '../components/NewsArticle';
import Loader from '../components/Loader';
import { fetchNews } from '../utils/fetchNews';
import { DeviceContext } from '../App';

export default function News({ radioState }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.showDualPaneShell;
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
    <div className={
      isSplitScreen
        ? "h-full w-full relative flex flex-col" // Split-screen: fill entire section with background and use flex layout
        : "min-app-height relative overflow-hidden" // Single page: full screen
    }>
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

      {/* Header - Clean solid with border */}
      <div className={`
        sticky top-0 z-10
        ${isSplitScreen
          ? 'px-[clamp(1rem,0.9rem+0.36vw,2rem)] py-[clamp(1rem,0.92rem+0.26vw,1.45rem)]'
          : 'px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] py-[clamp(1rem,0.92rem+0.3vw,1.7rem)]'
        }
      `}>
        {/* Clean solid header background */}
        <div className={`absolute inset-0 border-b border-border ${
          isSplitScreen
            ? 'bg-bg-secondary' // Solid background
            : 'bg-bg-primary'
        }`} />

        {/* Content wrapper - centered to match articles */}
        <div className={isSplitScreen ? "relative mx-auto w-full max-w-[min(100%,76rem)]" : "relative mx-auto w-full max-w-[min(100%,120rem)]"}>
          <h1 className={`
            font-bold text-text-primary
            ${isSplitScreen ? 'text-[clamp(1.25rem,1.14rem+0.42vw,2rem)]' : 'text-[clamp(1.5rem,1.32rem+0.78vw,3rem)]'}
          `}>Știri</h1>
          <p className={`
            text-text-tertiary font-medium mt-1
            ${isSplitScreen ? 'text-[clamp(0.82rem,0.78rem+0.18vw,1.05rem)]' : 'text-[clamp(0.88rem,0.82rem+0.24vw,1.2rem)]'}
          `}>Ultimele noutăți din Dobrogea</p>
        </div>
      </div>

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
    </div>
  );
}
