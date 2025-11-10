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
            ? 'px-4 pt-0 flex flex-col gap-4 max-w-full 4k:px-8 4k:gap-6'
            : `px-4 pt-6 md:px-6 md:pt-8 lg:px-8 tv:px-12 tv:pt-10 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 tv:grid-cols-3 tv:gap-8 4k:px-16 4k:pt-16 4k:gap-12`
        }
      >
        {articles.map((article, index) => (
          <motion.div
            key={article.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className={isSplitScreen ? 'max-w-[850px] mx-auto w-full 4k:max-w-[1400px]' : ''}
          >
            <Card
              variant="default"
              radius="large"
              padding="none"
              interactive
              onClick={() => onArticleClick(article)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onArticleClick(article);
                }
              }}
              className={
                isSplitScreen
                  ? 'overflow-hidden group hover:shadow-lg transition-shadow duration-300'
                  : 'overflow-hidden group'
              }
              aria-label={`Read article: ${article.title}`}
            >
              <motion.div
                className={isSplitScreen ? 'flex flex-row h-[140px] 4k:h-[200px]' : ''}
                whileHover={isSplitScreen ? { scale: 1.01 } : {}}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Image */}
                {article.image && (
                  <div
                    className={
                      isSplitScreen
                        ? 'relative bg-bg-secondary overflow-hidden w-[35%] flex-shrink-0 rounded-l-[12px] 4k:w-[35%]'
                        : 'relative w-full bg-bg-secondary overflow-hidden h-48 md:h-52 lg:h-56 tv:h-72 4k:h-96 rounded-t-[12px]'
                    }
                  >
                    <motion.img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      loading="lazy"
                      style={{ imageRendering: 'auto' }}
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/800x400/1A1F2E/7CA9DB?text=Radio+Constanta';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  className={
                    isSplitScreen
                      ? 'p-4 flex-1 flex flex-col justify-start overflow-hidden 4k:p-6'
                      : 'p-4 md:p-5 lg:p-6 tv:p-8 4k:p-12'
                  }
                >
                  {/* Category & Date */}
                  <div
                    className={
                      isSplitScreen
                        ? 'flex items-center gap-2 mb-1.5 font-medium text-[9px] text-text-tertiary 4k:text-[14px] 4k:mb-2'
                        : 'flex items-center gap-2 mb-2 font-medium text-[12px] text-text-tertiary md:mb-3 4k:text-[18px] 4k:mb-4'
                    }
                  >
                    {article.category && (
                      <>
                        <Caption
                          weight="semibold"
                          className={
                            isSplitScreen
                              ? 'px-2 py-0.5 rounded-[6px] bg-primary/15 text-primary text-[9px] transition-colors group-hover:bg-primary/20 4k:text-[14px] 4k:px-3 4k:py-1 4k:rounded-[8px]'
                              : 'px-2 py-0.5 rounded-full bg-primary/10 text-primary 4k:text-[18px] 4k:px-4 4k:py-1'
                          }
                        >
                          {article.category}
                        </Caption>
                        <span className="w-1 h-1 bg-border rounded-full" aria-hidden="true" />
                      </>
                    )}
                    <time>{formatDate(article.date)}</time>
                  </div>

                  {/* Title */}
                  <Heading
                    level={4}
                    className={
                      isSplitScreen
                        ? 'mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-[13px] font-bold 4k:text-[20px] 4k:mb-2'
                        : 'mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors 4k:text-[28px] 4k:mb-4'
                    }
                  >
                    {article.title}
                  </Heading>

                  {/* Summary */}
                  {article.summary && (
                    <Body
                      size="small"
                      opacity="secondary"
                      clamp={isSplitScreen ? 2 : 2}
                      className={
                        isSplitScreen
                          ? 'leading-relaxed text-[11px] 4k:text-[16px]'
                          : 'leading-relaxed 4k:text-[20px]'
                      }
                    >
                      {article.summary}
                    </Body>
                  )}
                </div>
              </motion.div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            isSplitScreen
              ? 'px-4 mt-6 max-w-[850px] mx-auto 4k:px-8 4k:mt-10 4k:max-w-[1400px]'
              : 'px-4 mt-6 md:px-6 md:mt-8 tv:px-12 tv:mt-10 4k:px-16 4k:mt-16'
          }
        >
          <Button
            variant="secondary"
            size="normal"
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
        <div className="px-4 mt-8 text-center">
          <Body size="small" opacity="tertiary" className="mb-3">
            Pentru știri mai vechi, vizitează
          </Body>
          <a
            href="https://www.radioconstanta.ro/articole/stiri/actualitate/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-medium focusable rounded-lg px-3 py-1"
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
