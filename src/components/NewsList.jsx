import { motion } from 'framer-motion';

export default function NewsList({ articles, onArticleClick, onLoadMore, hasMore, loading }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Acum';
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
            transition={{ delay: index * 0.05 }}
            onClick={() => onArticleClick(article)}
            className="bg-dark-card rounded-2xl overflow-hidden card-shadow cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            {/* Image */}
            {article.image && (
              <div className="relative w-full h-56 bg-dark-surface overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  style={{ imageRendering: 'auto' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400/1A1A1A/00BFFF?text=Radio+Constanta';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-card/80 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {/* Category & Date */}
              <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
                {article.category && (
                  <>
                    <span className="text-primary font-medium">{article.category}</span>
                    <span>•</span>
                  </>
                )}
                <time>{formatDate(article.date)}</time>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-2 line-clamp-2 leading-snug">
                {article.title}
              </h3>

              {/* Summary */}
              {article.summary && (
                <p className="text-white/60 text-sm line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="px-4 mt-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-dark-card hover:bg-dark-card/80 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Se încarcă...' : 'Încarcă mai multe'}
          </button>
        </div>
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
