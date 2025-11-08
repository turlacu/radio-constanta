import { motion } from 'framer-motion';
import { useContext } from 'react';
import { DeviceContext } from '../App';
import { Card, Heading, Body, Caption, Button } from './ui';

export default function NewsList({ articles, onArticleClick, onLoadMore, hasMore, loading }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.screenWidth >= 768;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return 'acum';
    if (diffInMinutes < 60) return `${diffInMinutes} min în urmă`;
    if (diffInHours < 24) return `${diffInHours}h în urmă`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `${diffInDays} zile în urmă`;

    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={isSplitScreen ? 'pb-6' : 'pb-20 md:pb-24 tv:pb-16'}>
      <div
        className={
          isSplitScreen
            ? 'px-4 pt-0 flex flex-col gap-3 max-w-full'
            : `px-4 pt-6 md:px-6 md:pt-8 lg:px-8 tv:px-12 tv:pt-10 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 tv:grid-cols-3 tv:gap-8`
        }
      >
        {articles.map((article, index) => (
          <Card
            key={article.id || index}
            variant="glass"
            radius="large"
            padding="none"
            interactive
            focusable
            onClick={() => onArticleClick(article)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onArticleClick(article);
              }
            }}
            className={
              isSplitScreen
                ? 'max-w-[850px] mx-auto h-32'
                : ''
            }
            aria-label={`Read article: ${article.title}`}
          >
            <div className={isSplitScreen ? 'flex flex-row h-full' : ''}>
              {/* Image */}
              {article.image && (
                <div
                  className={
                    isSplitScreen
                      ? 'relative bg-dark-surface overflow-hidden w-48 h-full flex-shrink-0 rounded-l-lg'
                      : 'relative w-full bg-dark-surface overflow-hidden h-48 md:h-52 lg:h-56 tv:h-72'
                  }
                >
                  <motion.img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    style={{ imageRendering: 'auto' }}
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/800x400/1A1A1A/00BFFF?text=Radio+Constanta';
                    }}
                  />
                  {!isSplitScreen && (
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-dark-bg/20 to-transparent" />
                  )}
                </div>
              )}

              {/* Content */}
              <div
                className={
                  isSplitScreen
                    ? 'p-3 flex-1 flex flex-col justify-start'
                    : 'p-4 md:p-5 lg:p-6 tv:p-8'
                }
              >
                {/* Category & Date */}
                <div
                  className={
                    isSplitScreen
                      ? 'flex items-center gap-2 mb-1 font-medium text-[10px] text-white/50'
                      : 'flex items-center gap-2 mb-2 font-medium text-responsive-xs text-white/50 md:mb-3'
                  }
                >
                  {article.category && (
                    <>
                      <Caption
                        weight="semibold"
                        className={
                          isSplitScreen
                            ? 'px-1.5 py-0.5 rounded-full bg-primary/20 text-primary'
                            : 'px-2 py-0.5 rounded-full bg-primary/20 text-primary'
                        }
                      >
                        {article.category}
                      </Caption>
                      <span className="w-0.5 h-0.5 bg-white/30 rounded-full" aria-hidden="true" />
                    </>
                  )}
                  <time>{formatDate(article.date)}</time>
                </div>

                {/* Title */}
                <Heading
                  level={4}
                  className={
                    isSplitScreen
                      ? 'mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors text-responsive-sm font-semibold'
                      : 'mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors'
                  }
                >
                  {article.title}
                </Heading>

                {/* Summary */}
                {article.summary && (
                  <Body
                    size="sm"
                    opacity="secondary"
                    clamp={2}
                    className={
                      isSplitScreen
                        ? 'leading-relaxed text-responsive-xs mt-1'
                        : 'leading-relaxed'
                    }
                  >
                    {article.summary}
                  </Body>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            isSplitScreen
              ? 'px-4 mt-6 max-w-[850px] mx-auto'
              : 'px-4 mt-6 md:px-6 md:mt-8 tv:px-12 tv:mt-10'
          }
        >
          <Button
            variant="secondary"
            size="md"
            fullWidth={!isSplitScreen}
            onClick={onLoadMore}
            disabled={loading}
            className={isSplitScreen ? 'max-w-xs mx-auto block' : ''}
            aria-label="Load more articles"
          >
            {loading ? 'Se încarcă...' : 'Încarcă mai multe'}
          </Button>
        </motion.div>
      )}

      {/* Link to website */}
      {!hasMore && articles.length > 0 && (
        <div className="px-4 mt-6 text-center">
          <Body size="sm" opacity="tertiary" className="mb-3">
            Pentru știri mai vechi, vizitează
          </Body>
          <a
            href="https://www.radioconstanta.ro/articole/stiri/actualitate/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium tv-focusable"
            aria-label="Visit Radio Constanta website for more articles"
          >
            radioconstanta.ro
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
