import { motion } from 'framer-motion';
import { useContext } from 'react';
import { DeviceContext } from '../App';
import { Card, Heading, Body, Button } from './ui';

export default function NewsList({ articles, onArticleClick, onLoadMore, hasMore, loading }) {
  const device = useContext(DeviceContext);
  const isSplitScreen = device?.policy?.canShowNewsRail;
  const listShellClass = isSplitScreen
    ? 'mx-auto flex w-full max-w-[58rem] flex-col gap-[clamp(0.9rem,0.82rem+0.32vw,1.5rem)] px-[clamp(1rem,0.9rem+0.36vw,2rem)] pt-[clamp(1rem,0.92rem+0.28vw,1.5rem)] pb-[clamp(0.4rem,0.3rem+0.18vw,0.7rem)]'
    : 'mx-auto grid w-full max-w-[96rem] grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-[clamp(1rem,0.9rem+0.35vw,1.75rem)] px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] pt-[clamp(1.5rem,1.32rem+0.72vw,2.8rem)] min-[1100px]:grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]';
  const splitCardFrameClass = 'grid min-h-[clamp(10rem,9.2rem+1.8vw,13rem)] grid-cols-[minmax(clamp(9rem,8.3rem+1.4vw,12.5rem),32%)_minmax(0,1fr)] items-stretch';
  const splitMetaClass = 'mb-[clamp(0.45rem,0.38rem+0.16vw,0.65rem)] flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[clamp(0.68rem,0.65rem+0.12vw,0.82rem)] text-text-tertiary';
  const stackedMetaClass = 'mb-[clamp(0.65rem,0.58rem+0.2vw,0.95rem)] flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[clamp(0.75rem,0.72rem+0.12vw,0.92rem)] text-text-tertiary';
  const splitTitleClass = 'mb-[clamp(0.45rem,0.38rem+0.16vw,0.65rem)] line-clamp-2 text-[clamp(0.95rem,0.9rem+0.2vw,1.2rem)] font-bold leading-snug transition-colors group-hover:text-primary';
  const stackedTitleClass = 'mb-[clamp(0.65rem,0.58rem+0.2vw,0.95rem)] line-clamp-3 text-[clamp(1rem,0.96rem+0.22vw,1.28rem)] leading-snug transition-colors group-hover:text-primary';
  const splitSummaryClass = 'line-clamp-3 text-[clamp(0.76rem,0.73rem+0.12vw,0.92rem)] leading-relaxed';
  const stackedSummaryClass = 'line-clamp-4 text-[clamp(0.82rem,0.78rem+0.16vw,1rem)] leading-relaxed';

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
    <div className={isSplitScreen ? 'pb-[clamp(1.5rem,1.32rem+0.7vw,2.6rem)]' : 'pb-[clamp(4.5rem,4rem+1.8vw,6.5rem)]'}>
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
                    ? splitCardFrameClass
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
                      ? 'flex flex-1 flex-col justify-center overflow-hidden p-[clamp(1rem,0.92rem+0.28vw,1.5rem)]'
                      : 'flex flex-1 flex-col justify-between p-[clamp(1rem,0.92rem+0.34vw,1.6rem)]'
                  }
                >
                  {/* Category & Date */}
                  <div className={isSplitScreen ? splitMetaClass : stackedMetaClass}>
                    {article.category && (
                      <>
                        <span
                          className={
                            isSplitScreen
                              ? 'text-[clamp(0.68rem,0.65rem+0.12vw,0.82rem)] font-bold text-primary'
                              : 'text-[clamp(0.75rem,0.72rem+0.12vw,0.92rem)] font-bold text-primary'
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
                    className={isSplitScreen ? splitTitleClass : stackedTitleClass}
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
                          ? splitSummaryClass
                          : stackedSummaryClass
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
              ? 'mx-auto mt-[clamp(1.5rem,1.32rem+0.7vw,2.6rem)] w-full max-w-[58rem] px-[clamp(1rem,0.9rem+0.36vw,2rem)]'
              : 'mx-auto mt-[clamp(1.5rem,1.32rem+0.72vw,2.8rem)] w-full max-w-[96rem] px-[clamp(1rem,0.86rem+0.52vw,2.5rem)]'
          }
        >
          <Button
            variant="secondary"
            size="normal"
            fullWidth={!isSplitScreen}
            onClick={onLoadMore}
            disabled={loading}
            className={isSplitScreen ? 'mx-auto block max-w-[min(100%,18rem)]' : ''}
            aria-label="Load more articles"
          >
            {loading ? 'Se încarcă...' : 'Încarcă mai multe'}
          </Button>
        </motion.div>
      )}

      {/* Link to website */}
      {!hasMore && articles.length > 0 && (
        <div className={`mx-auto mt-[clamp(2rem,1.8rem+0.75vw,3rem)] text-center ${isSplitScreen ? 'max-w-[58rem] px-[clamp(1rem,0.9rem+0.36vw,2rem)]' : 'max-w-[96rem] px-[clamp(1rem,0.86rem+0.52vw,2.5rem)]'}`}>
          <Body size="small" opacity="tertiary" className="mb-3">
            Pentru știri mai vechi, vizitează
          </Body>
          <a
            href="https://www.radioconstanta.ro/articole/stiri/actualitate/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-[clamp(0.75rem,0.68rem+0.2vw,1rem)] py-[clamp(0.3rem,0.26rem+0.1vw,0.45rem)] font-medium text-primary transition-colors hover:text-primary-dark focusable"
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
