import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import Loader from './Loader';
import { Heading, Body, Caption, Button } from './ui';
import { useArticleMedia } from '../hooks/useArticleMedia';

export default function NewsArticle({ article, onBack, radioState, isSplitScreen }) {
  const [fullContent, setFullContent] = useState(article.content || '');
  const [fullImage, setFullImage] = useState(article.image);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          setFullContent(data.content);
        }

        if (data.image) {
          setFullImage(data.image);
        }
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
  }, [article.link]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        isSplitScreen
          ? 'h-full bg-dark-bg overflow-y-auto scrollbar-hide pb-6'
          : 'fixed inset-0 bg-dark-bg z-50 overflow-y-auto scrollbar-hide pb-20 md:pb-24 tv:pb-16'
      }
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10">
        {/* Glassmorphic header background */}
        <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-xl border-b border-white/10" />

        <div className="relative flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 md:gap-4 tv:px-12 tv:py-6 tv:gap-6">
          <Button
            variant="ghost"
            icon
            size="md"
            onClick={onBack}
            aria-label="Go back to news list"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 tv:w-8 tv:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
          <Heading level={4} className="text-white/90 font-semibold">
            Înapoi la știri
          </Heading>
        </div>
      </div>

      {/* Article Content */}
      <article className="relative mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 tv:px-12 tv:py-10 max-w-2xl lg:max-w-4xl tv:max-w-6xl">
        {/* Featured Image */}
        {fullImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative w-full overflow-hidden shadow-2xl h-56 rounded-lg mb-4 md:h-72 md:mb-6 lg:h-80 lg:rounded-xl tv:h-96 tv:rounded-2xl tv:mb-10"
          >
            <div className="absolute inset-0 border-2 border-white/10 rounded-lg z-10 pointer-events-none" />
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
          className="flex items-center gap-2 mb-3 font-medium text-white/50 text-responsive-xs md:mb-4"
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
          <Heading level={1} gradient className="mb-3 md:mb-4 tv:mb-6">
            {article.title}
          </Heading>
        </motion.div>

        {/* Summary - only show if full content hasn't loaded yet */}
        {article.summary && !fullContent && !loading && (
          <Body size="lg" opacity="secondary" className="mb-5 md:mb-6 tv:mb-8">
            {article.summary}
          </Body>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 md:py-12 tv:py-16">
            <Loader size="medium" />
            <Body size="sm" opacity="tertiary" className="mt-4">
              Se încarcă articolul complet...
            </Body>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl mb-5 p-4 md:p-5 md:mb-6 tv:p-8 tv:mb-8">
            <Body size="sm" className="text-red-400 mb-2">
              {error}
            </Body>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm underline inline-block tv-focusable"
              aria-label="Read full article on Radio Constanta website"
            >
              Citește pe radioconstanta.ro
            </a>
          </div>
        )}

        {/* Content */}
        {!loading && fullContent && (
          <div className="prose prose-invert max-w-none overflow-x-hidden">
            <div
              className="text-white/80 leading-relaxed space-y-4 text-justify text-responsive-sm md:text-responsive-base lg:text-responsive-lg"
              dangerouslySetInnerHTML={{ __html: fullContent }}
            />
          </div>
        )}

        {/* Link to original - only show for articles older than 3 days */}
        {article.link && isOlderThanThreeDays && (
          <div className="mt-6 pt-5 border-t border-white/10 md:mt-8 md:pt-6 tv:mt-12 tv:pt-10">
            <Body size="sm" opacity="tertiary" className="mb-3">
              Acest articol are mai mult de 3 zile. Pentru informații actualizate, vizitează:
            </Body>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium tv-focusable text-responsive-base md:text-responsive-lg"
              aria-label="Visit Radio Constanta website for updated information"
            >
              radioconstanta.ro
              <svg
                className="w-4 h-4 md:w-5 md:h-5 tv:w-6 tv:h-6"
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
    </motion.div>
  );
}
