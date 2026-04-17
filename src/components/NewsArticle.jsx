import { motion } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import Loader from './Loader';
import { Heading, Body, Caption } from './ui';
import NewsHeader from './NewsHeader';
import { useArticleMedia } from '../hooks/useArticleMedia';
import analytics from '../utils/analytics';

export default function NewsArticle({ article, onBack, radioState, isSplitScreen }) {
  const scrollRef = useRef(null);
  const normalizeArticleMarkup = (html) => {
    if (!html) return '';

    // Source pages often embed inline font stacks; remove those so app typography stays consistent.
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<font\b[^>]*>/gi, '')
      .replace(/<\/font>/gi, '')
      .replace(/\sface=(['"])(.*?)\1/gi, '')
      .replace(/\sstyle=(['"])(.*?)\1/gi, (match, quote, styleValue) => {
        const cleanedStyle = styleValue
          .replace(/font-family\s*:[^;]+;?/gi, '')
          .replace(/font\s*:[^;]*;?/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .replace(/^;|;$/g, '');

        return cleanedStyle ? ` style=${quote}${cleanedStyle}${quote}` : '';
      });
  };
  const [fullContent, setFullContent] = useState(normalizeArticleMarkup(article.content || ''));
  const [fullImage, setFullImage] = useState(article.image);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const splitShellClass = 'mx-auto w-full max-w-[64rem] px-[clamp(1.15rem,1rem+0.42vw,2.25rem)]';
  const articleShellClass = isSplitScreen
    ? `${splitShellClass} py-[clamp(1.3rem,1.15rem+0.52vw,2rem)]`
    : 'mx-auto w-full max-w-[54rem] px-[clamp(1rem,0.86rem+0.52vw,2.5rem)] py-[clamp(1.25rem,1.12rem+0.55vw,2.4rem)] min-[1500px]:max-w-[66rem]';
  const articleBodyClass = [
    'font-sans text-[clamp(0.94rem,0.9rem+0.22vw,1.14rem)] leading-[1.8] text-white/84 [&_*]:!font-sans',
    '[&_p]:mb-[clamp(1rem,0.92rem+0.25vw,1.4rem)] [&_p]:text-pretty',
    '[&_h2]:mb-[clamp(0.8rem,0.74rem+0.16vw,1rem)] [&_h2]:mt-[clamp(2rem,1.8rem+0.7vw,3rem)] [&_h2]:text-[clamp(1.22rem,1.12rem+0.34vw,1.55rem)] [&_h2]:font-bold [&_h2]:leading-tight',
    '[&_h3]:mb-[clamp(0.72rem,0.67rem+0.14vw,0.9rem)] [&_h3]:mt-[clamp(1.7rem,1.55rem+0.5vw,2.5rem)] [&_h3]:text-[clamp(1rem,0.93rem+0.24vw,1.22rem)] [&_h3]:font-semibold [&_h3]:leading-tight',
    '[&_ul]:mb-[clamp(1rem,0.92rem+0.25vw,1.4rem)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
    '[&_ol]:mb-[clamp(1rem,0.92rem+0.25vw,1.4rem)] [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
    '[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:text-primary/80 hover:[&_a]:underline',
    '[&_strong]:font-semibold [&_blockquote]:my-[clamp(1.4rem,1.28rem+0.4vw,2rem)] [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-white/72',
    '[&_img]:my-[clamp(1.6rem,1.45rem+0.5vw,2.4rem)] [&_img]:rounded-2xl'
  ].join(' ');

  if (!article) return null;

  // Use custom hook for media handling
  useArticleMedia(fullContent, radioState);

  // Fetch full article content when component mounts
  useEffect(() => {
    const fetchFullArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/article?url=${encodeURIComponent(article.link)}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch article: ${response.status}`);
        }

        const data = await response.json();

        if (data.content) {
          setFullContent(normalizeArticleMarkup(data.content));
        }

        if (data.image) {
          setFullImage(data.image);
        }

        // Track article view
        analytics.trackArticleView(article.id || article.link, article.title);
      } catch (err) {
        console.error('Error fetching full article:', err);
        setError(
          'Nu s-a putut încărca articolul complet. Click pe linkul de mai jos pentru a citi pe site.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFullArticle();
  }, [article.link, article.id, article.title]);

  // Format date
  const formattedDate = useMemo(() => {
    const date = new Date(article.date);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [article.date]);

  // Check if article is older than 3 days
  const isOlderThanThreeDays = useMemo(() => {
    const articleDate = new Date(article.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return articleDate < threeDaysAgo;
  }, [article.date]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const handleScroll = () => {
      setShowBackToTop(node.scrollTop > 220);
    };

    handleScroll();
    node.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        isSplitScreen
          ? 'h-full bg-bg-secondary overflow-y-auto scrollbar-hide pb-[clamp(1.5rem,1.32rem+0.7vw,2.6rem)]'
          : 'fixed inset-0 z-50 overflow-y-auto scrollbar-hide bg-bg-primary pb-[clamp(4.5rem,4rem+1.8vw,6.5rem)]'
      }
    >
      {/* Subtle ambient glow accents */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <NewsHeader
        isSplitScreen={isSplitScreen}
        onBack={onBack}
        subtitle="Înapoi la știri"
      />

      {/* Article Content */}
      <article className={`relative ${articleShellClass}`}>
        {/* Featured Image */}
        {fullImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-[clamp(1.25rem,1.1rem+0.52vw,2rem)] aspect-[16/9] w-full overflow-hidden rounded-[1.25rem] shadow-2xl"
          >
            <div className="absolute inset-0 z-10 rounded-[1.25rem] border border-white/10 pointer-events-none" />
            <img
              src={fullImage}
              alt={article.title}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                e.target.src =
                  'https://via.placeholder.com/800x450/1A1A1A/00BFFF?text=Radio+Constanta';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/60 via-transparent to-transparent" />
          </motion.div>
        )}

        {/* Category & Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-[clamp(0.65rem,0.58rem+0.22vw,1rem)] flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-white/50 text-responsive-xs"
        >
          {article.category && (
            <>
              <Caption
                weight="semibold"
                className="px-3 py-1.5 rounded-md bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20"
              >
                {article.category}
              </Caption>
              <span className="w-1 h-1 bg-white/30 rounded-full" aria-hidden="true" />
            </>
          )}
          <time>{formattedDate}</time>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Heading level={2} gradient className="mb-[clamp(0.72rem,0.62rem+0.34vw,1.25rem)] text-balance text-[clamp(1.14rem,1.06rem+0.32vw,1.52rem)]">
            {article.title}
          </Heading>
        </motion.div>

        {/* Summary - only show if full content hasn't loaded yet */}
        {article.summary && !fullContent && !loading && (
          <Body size="medium" opacity="secondary" className="mb-[clamp(1.25rem,1.1rem+0.52vw,2rem)]">
            {article.summary}
          </Body>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-[clamp(2.5rem,2.2rem+1vw,4rem)]">
            <Loader size="medium" />
            <Body size="small" opacity="tertiary" className="mt-4">
              Se încarcă articolul complet...
            </Body>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-[clamp(1.25rem,1.1rem+0.52vw,2rem)] rounded-xl border border-red-500/30 bg-red-500/10 p-[clamp(1rem,0.92rem+0.3vw,1.5rem)]">
            <Body size="small" className="text-red-400 mb-2">
              {error}
            </Body>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-responsive-sm text-primary underline tv-focusable hover:text-primary/80"
              aria-label="Read full article on Radio Constanta website"
            >
              Citește pe radioconstanta.ro
            </a>
          </div>
        )}

        {/* Content */}
        {!loading && fullContent && (
          <div className="prose prose-invert max-w-none overflow-x-hidden font-sans force-geist">
            <div
              className={articleBodyClass}
              dangerouslySetInnerHTML={{ __html: fullContent }}
            />
          </div>
        )}

        {/* Link to original - only show for articles older than 3 days */}
        {article.link && isOlderThanThreeDays && (
          <div className="mt-[clamp(1.5rem,1.32rem+0.7vw,2.6rem)] border-t border-white/10 pt-[clamp(1.25rem,1.12rem+0.46vw,1.9rem)]">
            <Body size="small" opacity="tertiary" className="mb-3">
              Acest articol are mai mult de 3 zile. Pentru informații actualizate, vizitează:
            </Body>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              className="inline-flex items-center gap-2 text-responsive-base font-medium text-primary transition-colors hover:text-primary/80 tv-focusable"
              aria-label="Visit Radio Constanta website for updated information"
            >
              radioconstanta.ro
              <svg
                className="h-[clamp(1rem,0.94rem+0.2vw,1.3rem)] w-[clamp(1rem,0.94rem+0.2vw,1.3rem)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
      </article>

      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-bg-tertiary/90 text-white shadow-[0_12px_28px_rgba(2,6,23,0.3)] backdrop-blur-lg transition-colors hover:bg-bg-tertiary"
          aria-label="Back to top"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}
