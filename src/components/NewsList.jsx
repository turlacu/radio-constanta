import { motion } from 'framer-motion';

export default function NewsList({ articles, onArticleClick, onLoadMore, hasMore, loading }) {
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
    <div className="pb-20">
      <div className="space-y-4 px-4 pt-6">
        {articles.map((article, index) => (
          <motion.article
            key={article.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
            onClick={() => onArticleClick(article)}
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
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

            <div className="relative">
              {/* Image */}
              {article.image && (
                <div className="relative w-full h-56 bg-dark-surface overflow-hidden">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-dark-bg/20 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                {/* Category & Date */}
                <div className="flex items-center gap-2 mb-3 text-xs text-white/50 font-medium">
                  {article.category && (
                    <>
                      <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                        {article.category}
                      </span>
                      <span className="w-1 h-1 bg-white/30 rounded-full" />
                    </>
                  )}
                  <time>{formatDate(article.date)}</time>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {article.title}
                </h3>

                {/* Summary */}
                {article.summary && (
                  <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
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
          className="px-4 mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            disabled={loading}
            className="relative w-full py-4 rounded-2xl font-semibold overflow-hidden disabled:opacity-50 group"
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
