import express from 'express';

const router = express.Router();

// WordPress REST API endpoint - much faster than RSS
const WP_API_URL = 'https://www.radioconstanta.ro/wp-json/wp/v2/posts';

// In-memory cache
let cachedArticles = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Helper to strip HTML tags from text
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to truncate text at word boundary
const truncateAtWord = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // If we found a space, truncate there; otherwise use maxLength
  const cutoff = lastSpace > 0 ? lastSpace : maxLength;

  return text.substring(0, cutoff).trim() + '...';
};

// Fetch articles from WordPress REST API
const fetchFromWordPressAPI = async (limit = 20) => {
  try {
    console.log('Fetching from WordPress REST API...');

    // Use _embed to get featured images and author info in one request
    const url = `${WP_API_URL}?per_page=${limit}&_embed`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`WordPress API fetch failed: ${response.status}`);
    }

    const posts = await response.json();
    console.log(`Fetched ${posts.length} posts from WordPress API`);

    const articles = posts.map((post) => {
      try {
        // Extract basic fields
        const title = post.title?.rendered || '';
        const link = post.link || '';
        const content = post.content?.rendered || '';
        const excerpt = post.excerpt?.rendered || '';
        const date = post.date || new Date().toISOString();
        const id = post.id?.toString() || `post-${Date.now()}`;

        // Extract author name from embedded data
        const authorName = post._embedded?.author?.[0]?.name || 'Radio Constanta';

        // Extract category name from embedded data
        const categories = post._embedded?.['wp:term']?.[0] || [];
        const categoryName = categories[0]?.name || 'Actualitate';

        // Extract featured image from embedded data
        let image = null;
        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];

        // Check if featured media is valid (not an error response)
        if (featuredMedia && !featuredMedia.code && featuredMedia.source_url) {
          // Use medium_large size for list view (good balance between quality and speed)
          const mediaDetails = featuredMedia.media_details?.sizes;
          if (mediaDetails?.medium_large) {
            image = mediaDetails.medium_large.source_url;
          } else if (mediaDetails?.large) {
            image = mediaDetails.large.source_url;
          } else {
            // Fallback to full size with width param for optimization
            const baseUrl = featuredMedia.source_url.split('?')[0];
            image = `${baseUrl}?w=400&quality=80`;
          }
        }

        // Use placeholder if no image
        if (!image) {
          image = 'https://via.placeholder.com/768x432/1A1A1A/00BFFF?text=Radio+Constanta';
        }

        // Create summary from excerpt
        const cleanExcerpt = stripHtml(excerpt);
        const summary = truncateAtWord(cleanExcerpt, 200);

        return {
          id: id,
          title: stripHtml(title),
          summary: summary,
          image: image,
          category: stripHtml(categoryName),
          date: date,
          link: link,
          content: '', // Don't include full content for list view
          author: stripHtml(authorName)
        };
      } catch (err) {
        console.error('Error parsing WordPress post:', err);
        return null;
      }
    }).filter(article => article !== null && article.title && article.link);

    const articlesWithImages = articles.filter(a => !a.image.includes('placeholder')).length;
    console.log(`Successfully parsed ${articles.length} articles (${articlesWithImages} with images)`);
    return articles;

  } catch (error) {
    console.error('Error fetching from WordPress API:', error);
    throw error;
  }
};

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Check if cache is valid
    const now = Date.now();
    const cacheIsValid = cachedArticles && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION);

    let articles;

    if (cacheIsValid) {
      console.log(`Cache HIT - returning cached articles (age: ${Math.round((now - cacheTimestamp) / 1000)}s)`);
      articles = cachedArticles;
    } else {
      console.log('Cache MISS - fetching fresh articles');
      try {
        // Fetch articles from WordPress REST API (much faster than RSS)
        // Start with 20 articles for fast response
        articles = await fetchFromWordPressAPI(20);

        // Update cache
        cachedArticles = articles;
        cacheTimestamp = now;
        console.log(`Cache updated with ${articles.length} articles`);

        // Background: Fetch more articles (up to 100) for pagination
        fetchFromWordPressAPI(100).then(fullArticles => {
          cachedArticles = fullArticles;
          console.log(`Background: Cache updated with ${fullArticles.length} articles`);
        }).catch(err => {
          console.error('Background fetch error:', err);
        });
      } catch (fetchError) {
        console.error('Error fetching fresh articles:', fetchError);

        // Fallback to stale cache if available
        if (cachedArticles) {
          console.log('Using stale cache as fallback');
          articles = cachedArticles;
        } else {
          throw fetchError; // No cache available, propagate error
        }
      }
    }

    // Filter by category if specified
    if (category) {
      articles = articles.filter(article =>
        article.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedArticles = articles.slice(start, end);

    console.log(`Returning ${paginatedArticles.length} articles (page ${pageNum})`);

    res.json({
      articles: paginatedArticles,
      hasMore: end < articles.length,
      total: articles.length,
      page: pageNum,
      limit: limitNum
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

export default router;
