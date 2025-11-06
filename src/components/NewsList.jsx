import { motion } from 'framer-motion';
import { useContext } from 'react';
import { DeviceContext } from '../App';

export default function NewsList({ articles, onArticleClick, onLoadMore, hasMore, loading, isSplitScreen }) {
  const device = useContext(DeviceContext);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    // Less than 1 minute
    if (diffInMinutes < 1) return 'acum';

    // Less than 1 hour - show minutes
    if (diffInMinutes < 60) return `${diffInMinutes} min în urmă`;

    // Less than 24 hours - show hours
    if (diffInHours < 24) return `${diffInHours}h în urmă`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `${diffInDays} zile în urmă`;

    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={isSplitScreen ? "pb-6" : "pb-20 md:pb-24 tv:pb-16"}>
      <div className={
        isSplitScreen
          ? "px-4 pt-0 flex flex-col gap-3 max-w-full" // Split-screen: less padding for wider articles, full width articles, no top padding
          : `
            px-4 pt-6
            md:px-6 md:pt-8
            lg:px-8
            tv:px-12 tv:pt-10
            grid gap-4
            md:grid-cols-2 md:gap-6
            lg:grid-cols-3
            tv:grid-cols-3 tv:gap-8
          `
      }>
        {articles.map((article, index) => (
          <motion.article
            key={article.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
            onClick={() => onArticleClick(article)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onArticleClick(article);
              }
            }}
            className={
              isSplitScreen
                ? "relative overflow-hidden cursor-pointer group tv-focusable rounded-lg max-w-[850px] mx-auto" // Limit width to 2.5x radio cover (340px × 2.5) and center
                : "relative overflow-hidden cursor-pointer group tv-focusable rounded-xl md:rounded-2xl tv:rounded-3xl"
            }
          >
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl transition-all group-hover:border-white/20 group-hover:from-white/15 group-hover:to-white/8" />

            {/* Glow effect on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.5 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur-xl rounded-2xl"
            />

            <div className={isSplitScreen ? "relative flex flex-row" : "relative"}>
              {/* Image */}
              {article.image && (
                <div className={
                  isSplitScreen
                    ? "relative bg-dark-surface overflow-hidden w-32 h-24 flex-shrink-0 rounded-l-lg" // Wider thumbnail for horizontal
                    : "relative w-full bg-dark-surface overflow-hidden h-48 md:h-52 lg:h-56 tv:h-72"
                }>
                  <motion.img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    style={{ imageRendering: 'auto' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400/1A1A1A/00BFFF?text=Radio+Constanta';
                    }}
                  />
                  {!isSplitScreen && (
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-dark-bg/20 to-transparent" />
                  )}
                </div>
              )}

              {/* Content */}
              <div className={
                isSplitScreen
                  ? "p-3 flex-1 flex flex-col justify-center" // Compact padding for horizontal layout
                  : "p-4 md:p-5 lg:p-6 tv:p-8"
              }>
                {/* Category & Date */}
                <div className={
                  isSplitScreen
                    ? "flex items-center gap-2 mb-1 font-medium text-[10px] text-white/50" // Smaller and more compact
                    : "flex items-center gap-2 mb-2 font-medium text-xs md:text-sm tv:text-base text-white/50 md:mb-3"
                }>
                  {article.category && (
                    <>
                      <span className={isSplitScreen ? "px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold" : "px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold"}>
                        {article.category}
                      </span>
                      <span className="w-0.5 h-0.5 bg-white/30 rounded-full" />
                    </>
                  )}
                  <time>{formatDate(article.date)}</time>
                </div>

                {/* Title */}
                <h3 className={
                  isSplitScreen
                    ? "font-semibold mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors text-sm" // Smaller and less bold
                    : "font-bold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-base md:text-lg lg:text-xl tv:text-2xl"
                }>
                  {article.title}
                </h3>

                {/* Summary */}
                {article.summary && (
                  <p className={
                    isSplitScreen
                      ? "text-white/70 line-clamp-2 leading-relaxed text-xs mt-1" // Show in split-screen with smaller text
                      : "text-white/70 line-clamp-2 leading-relaxed text-sm md:text-base tv:text-lg"
                  }>
                    {article.summary}
                  </p>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            isSplitScreen
              ? "px-4 mt-6 max-w-[850px] mx-auto" // Match article width in split-screen
              : "px-4 mt-6 md:px-6 md:mt-8 tv:px-12 tv:mt-10"
          }
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            disabled={loading}
            tabIndex={0}
            className={
              isSplitScreen
                ? "relative max-w-sm mx-auto font-semibold overflow-hidden disabled:opacity-50 group tv-focusable py-3 rounded-xl text-sm" // Normal button size in split-screen
                : "relative w-full font-semibold overflow-hidden disabled:opacity-50 group tv-focusable py-3 rounded-xl text-sm md:py-4 md:rounded-2xl md:text-base tv:py-6 tv:text-xl"
            }
          >
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-xl border border-primary/30 rounded-2xl transition-all group-hover:from-primary/30 group-hover:to-primary/20" />

            {/* Glow effect */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent blur-lg"
            />

            <span className="relative text-white">
              {loading ? 'Se încarcă...' : 'Încarcă mai multe'}
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Link to website */}
      {!hasMore && articles.length > 0 && (
        <div className="px-4 mt-6 text-center">
          <p className="text-white/50 text-sm mb-3">
            Pentru știri mai vechi, vizitează
          </p>
          <a
            href="https://www.radioconstanta.ro/articole/stiri/actualitate/"
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
    </div>
  );
}
