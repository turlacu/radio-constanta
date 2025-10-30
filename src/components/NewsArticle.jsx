import { motion } from 'framer-motion';

export default function NewsArticle({ article, onBack }) {
  if (!article) return null;

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
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg/95 backdrop-blur-sm border-b border-white/10 z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-dark-card hover:bg-dark-card/80 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-white/80">Înapoi la știri</h1>
        </div>
      </div>

      {/* Article Content */}
      <article className="px-6 py-6 max-w-2xl mx-auto">
        {/* Featured Image */}
        {article.image && (
          <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-6 card-shadow">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x450/1A1A1A/00BFFF?text=Radio+Constanta';
              }}
            />
          </div>
        )}

        {/* Category & Date */}
        <div className="flex items-center gap-2 mb-4 text-xs text-white/50">
          {article.category && (
            <>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                {article.category}
              </span>
              <span>•</span>
            </>
          )}
          <time>{formatDate(article.date)}</time>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4 leading-tight text-shadow">
          {article.title}
        </h1>

        {/* Summary */}
        {article.summary && (
          <p className="text-lg text-white/70 mb-6 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Content */}
        {article.content && (
          <div className="prose prose-invert max-w-none">
            <div
              className="text-white/80 text-base leading-relaxed space-y-4 text-justify"
              dangerouslySetInnerHTML={{ __html: article.content }}
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
