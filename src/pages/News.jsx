import { useState, useEffect } from 'react';
import NewsList from '../components/NewsList';
import NewsArticle from '../components/NewsArticle';
import Loader from '../components/Loader';
import { fetchNews } from '../utils/fetchNews';

export default function News({ radioState }) {
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
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader size="large" text="Se încarcă știrile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
        <svg className="w-16 h-16 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold mb-2">Oops!</h2>
        <p className="text-white/60 mb-6">{error}</p>
        <button
          onClick={loadInitialNews}
          className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-2xl font-medium transition-colors"
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
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4">
        {/* Glassmorphic header background */}
        <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-xl border-b border-white/10" />

        <div className="relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Știri</h1>
          <p className="text-white/60 text-sm mt-1 font-medium">Ultimele noutăți din Constanța</p>
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
        />
      </div>
    </div>
  );
}
