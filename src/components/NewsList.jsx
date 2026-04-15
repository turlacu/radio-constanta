import { motion } from 'framer-motion';
import { useContext } from 'react';
import { DeviceContext } from '../App';
import { Card, Heading, Body, Button } from './ui';

export default function NewsList({ articles, onArticleClick, onLoadMore, hasMore, loading }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.showDualPaneShell;
  const listShellClass = isSplitScreen
    ? 'mx-auto flex w-full max-w-[58rem] flex-col gap-4 px-4 pt-4 pb-2 xl:max-w-[64rem] xl:gap-5 xl:px-6 xl:pt-5 4k:max-w-[76rem] 4k:gap-6 4k:px-8'
    : 'mx-auto grid w-full max-w-[96rem] grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4 px-4 pt-6 md:gap-5 md:px-6 md:pt-8 lg:gap-6 lg:px-8 xl:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] tv:px-12 tv:pt-10 4k:max-w-[120rem] 4k:gap-8 4k:px-16 4k:pt-16';

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
      <div className={listShellClass}>
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
            className="w-full"
          >
            <Card
              variant="default"
              radius="large"
              padding="none"
              interactive
              onClick={() => onArticleClick(article)}
              className={
                isSplitScreen
                  ? 'group overflow-hidden border-white/8 bg-white/[0.035] hover:border-white/12 hover:shadow-lg transition-[border-color,box-shadow]'
                  : 'group overflow-hidden border-white/8 bg-white/[0.03] hover:border-white/12'
              }
              aria-label={`Read article: ${article.title}`}
            >
              <motion.div
                className={
                  isSplitScreen
                    ? 'grid min-h-[10.5rem] grid-cols-[minmax(10rem,32%)_minmax(0,1fr)] items-stretch xl:min-h-[12rem] 4k:min-h-[14rem]'
                    : 'flex h-full flex-col'
                }
                whileHover={isSplitScreen ? { scale: 1.01 } : {}}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Image */}
                {article.image && (
                  <div
                    className={
                      isSplitScreen
                        ? 'relative h-full overflow-hidden rounded-l-[12px] bg-bg-secondary'
                        : 'relative aspect-[16/9] w-full overflow-hidden rounded-t-[12px] bg-bg-secondary'
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
                        ? 'flex flex-1 flex-col justify-center overflow-hidden p-4 xl:p-5 4k:p-6'
                        : 'flex flex-1 flex-col justify-between p-4 md:p-5 lg:p-6 tv:p-7 4k:p-9'
                    }
                  >
                  {/* Category & Date */}
                  <div
                    className={
                      isSplitScreen
                        ? 'mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[11px] text-text-tertiary xl:text-[12px] 4k:text-[14px]'
                        : 'mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[12px] text-text-tertiary md:mb-4 md:text-[13px] 4k:text-[17px]'
                    }
                  >
                    {article.category && (
                      <>
                        <span
                          className={
                            isSplitScreen
                              ? 'text-[11px] font-bold text-primary xl:text-[12px] 4k:text-[14px]'
                              : 'font-bold text-primary text-[12px] 4k:text-[18px]'
                          }
                        >
                          {article.category}
                        </span>
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
                          ? 'mb-2 line-clamp-2 text-[15px] font-bold leading-snug transition-colors group-hover:text-primary xl:text-[17px] 4k:text-[20px]'
                          : 'mb-3 line-clamp-3 text-[1rem] leading-snug transition-colors group-hover:text-primary md:text-[1.05rem] lg:text-[1.1rem] 4k:mb-4 4k:text-[1.5rem]'
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
                          ? 'line-clamp-3 text-[12px] leading-relaxed xl:text-[13px] 4k:text-[15px]'
                          : 'line-clamp-4 text-[13px] leading-relaxed md:text-[14px] 4k:text-[19px]'
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
              ? 'mx-auto mt-6 w-full max-w-[58rem] px-4 xl:max-w-[64rem] xl:px-6 4k:max-w-[76rem] 4k:px-8 4k:mt-10'
              : 'mx-auto mt-6 w-full max-w-[96rem] px-4 md:px-6 md:mt-8 lg:px-8 tv:px-12 tv:mt-10 4k:max-w-[120rem] 4k:px-16 4k:mt-16'
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
        <div className={`mx-auto mt-8 text-center ${isSplitScreen ? 'max-w-[58rem] px-4 xl:max-w-[64rem] xl:px-6 4k:max-w-[76rem] 4k:px-8' : 'max-w-[96rem] px-4 md:px-6 lg:px-8 tv:px-12 4k:max-w-[120rem] 4k:px-16'}`}>
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
