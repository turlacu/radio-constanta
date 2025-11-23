import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Settings file path
const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

// Default WordPress REST API endpoint (fallback)
const DEFAULT_WP_API_URL = 'https://www.radioconstanta.ro/wp-json/wp/v2/posts';
const DEFAULT_SITE_NAME = 'Radio Constanța';

// Get WordPress API URL from settings
async function getWordPressConfig() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    return {
      apiUrl: settings.newsSource?.wordpressApiUrl || DEFAULT_WP_API_URL,
      siteName: settings.newsSource?.siteName || DEFAULT_SITE_NAME
    };
  } catch (error) {
    // Settings file doesn't exist or is invalid - use defaults
    return {
      apiUrl: DEFAULT_WP_API_URL,
      siteName: DEFAULT_SITE_NAME
    };
  }
}

// In-memory cache
let cachedArticles = [];
let cacheTimestamp = null;
let cacheReady = false;
const CACHE_MAX_SIZE = 100;              // Maximum articles to keep in cache
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes - background refresh interval

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

// Helper to proxy external image URLs through our server
// This prevents tracking prevention errors from third-party CDNs
const proxyImageUrl = (imageUrl) => {
  if (!imageUrl || imageUrl.includes('placeholder')) {
    return imageUrl;
  }

  // Only proxy external images (WordPress CDN, etc.)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  return imageUrl;
};

// Helper to fetch og:image from a URL (for fallback image extraction)
const fetchOgImage = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioApp/1.0)'
      }
    });
    if (!response.ok) return null;

    const html = await response.text();
    // Extract og:image from meta tag
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (ogMatch && ogMatch[1]) {
      return ogMatch[1];
    }
    return null;
  } catch (error) {
    console.log(`Failed to fetch og:image from ${url}: ${error.message}`);
    return null;
  }
};

// Fetch articles from WordPress REST API
const fetchFromWordPressAPI = async (limit = 20) => {
  try {
    // Get WordPress config from settings
    const wpConfig = await getWordPressConfig();
    console.log(`Fetching from WordPress REST API: ${wpConfig.apiUrl}`);

    // Use _embed to get featured images and author info in one request
    const url = `${wpConfig.apiUrl}?per_page=${limit}&_embed`;
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
        const authorName = post._embedded?.author?.[0]?.name || wpConfig.siteName;

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

        // Fallback: Try to extract first image from content if no featured media
        if (!image && content) {
          const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            // Get the image URL and optimize it
            let contentImage = imgMatch[1];
            // If it's a WordPress image, add size params
            if (contentImage.includes('wp-content') || contentImage.includes('wp.com')) {
              const baseUrl = contentImage.split('?')[0];
              contentImage = `${baseUrl}?w=400&quality=80`;
            }
            image = contentImage;
          }
        }

        // Fallback: Try to extract image from excerpt
        if (!image && excerpt) {
          const imgMatch = excerpt.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            image = imgMatch[1];
          }
        }

        // Create summary from excerpt
        const cleanExcerpt = stripHtml(excerpt);
        const summary = truncateAtWord(cleanExcerpt, 200);

        return {
          id: id,
          title: stripHtml(title),
          summary: summary,
          image: image, // Will be processed later
          category: stripHtml(categoryName),
          date: date,
          link: link,
          content: '', // Don't include full content for list view
          author: stripHtml(authorName),
          needsOgImage: !image // Flag for posts that need og:image fetch
        };
      } catch (err) {
        console.error('Error parsing WordPress post:', err);
        return null;
      }
    }).filter(article => article !== null && article.title && article.link);

    // Fetch og:image for articles without images (in parallel, max 10 at a time)
    const articlesNeedingImages = articles.filter(a => a.needsOgImage);
    if (articlesNeedingImages.length > 0) {
      console.log(`🖼️ Fetching og:image for ${articlesNeedingImages.length} articles without images...`);

      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < articlesNeedingImages.length; i += batchSize) {
        const batch = articlesNeedingImages.slice(i, i + batchSize);
        const ogImagePromises = batch.map(async (article) => {
          const ogImage = await fetchOgImage(article.link);
          if (ogImage) {
            article.image = ogImage;
            article.needsOgImage = false;
          }
        });
        await Promise.all(ogImagePromises);
      }
    }

    // Apply placeholder and proxy to all images
    const placeholderText = encodeURIComponent(wpConfig.siteName.replace(/\s+/g, '+'));
    const placeholder = `https://via.placeholder.com/768x432/1A1A1A/00BFFF?text=${placeholderText}`;

    articles.forEach(article => {
      if (!article.image) {
        article.image = placeholder;
      }
      article.image = proxyImageUrl(article.image);
      delete article.needsOgImage; // Clean up internal flag
    });

    const articlesWithImages = articles.filter(a => !a.image.includes('placeholder')).length;
    console.log(`Successfully parsed ${articles.length} articles (${articlesWithImages} with images)`);
    return articles;

  } catch (error) {
    console.error('Error fetching from WordPress API:', error);
    throw error;
  }
};

// Merge new articles into cache (incremental update)
const mergeArticlesIntoCache = (newArticles) => {
  const existingIds = new Set(cachedArticles.map(a => a.id));
  let addedCount = 0;
  let updatedCount = 0;

  for (const article of newArticles) {
    if (!existingIds.has(article.id)) {
      // New article - add to cache
      cachedArticles.push(article);
      addedCount++;
    } else {
      // Existing article - check if content changed (title or summary)
      const existing = cachedArticles.find(a => a.id === article.id);
      if (existing && (existing.title !== article.title || existing.summary !== article.summary)) {
        // Update the existing article
        Object.assign(existing, article);
        updatedCount++;
      }
    }
  }

  // Sort by date (newest first)
  cachedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Prune cache if over size limit (keep newest)
  if (cachedArticles.length > CACHE_MAX_SIZE) {
    const pruned = cachedArticles.length - CACHE_MAX_SIZE;
    cachedArticles = cachedArticles.slice(0, CACHE_MAX_SIZE);
    console.log(`🗑️ Pruned ${pruned} old articles from cache`);
  }

  return { addedCount, updatedCount };
};

// Background refresh - fetches and merges new articles
const refreshCache = async () => {
  try {
    console.log('🔄 Background refresh started');
    const fetchedArticles = await fetchFromWordPressAPI(CACHE_MAX_SIZE);

    const { addedCount, updatedCount } = mergeArticlesIntoCache(fetchedArticles);
    cacheTimestamp = Date.now();

    console.log(`✅ Background refresh complete: ${addedCount} new, ${updatedCount} updated, ${cachedArticles.length} total in cache`);
  } catch (err) {
    console.error('❌ Background refresh failed:', err.message);
    // Keep serving existing cache - don't clear it on error
  }
};

// Background refresh timer - runs every 10 minutes
const startBackgroundRefresh = () => {
  console.log(`🕐 Starting background refresh interval (every ${REFRESH_INTERVAL / 1000 / 60} minutes)`);

  setInterval(async () => {
    await refreshCache();
  }, REFRESH_INTERVAL);
};

// Initial cache population on server start
const initializeCache = async () => {
  try {
    console.log('🚀 Initializing cache on server start...');
    const articles = await fetchFromWordPressAPI(CACHE_MAX_SIZE);
    cachedArticles = articles;
    cacheTimestamp = Date.now();
    cacheReady = true;
    console.log(`✅ Cache initialized: ${articles.length} articles loaded`);

    // Start background refresh timer
    startBackgroundRefresh();
  } catch (err) {
    console.error('❌ Cache initialization failed:', err.message);
    console.log('⚠️ Cache will be empty until next refresh attempt');
    cacheReady = true; // Mark ready even if empty - don't block requests
    startBackgroundRefresh(); // Start timer anyway to retry
  }
};

// Initialize cache when module loads
initializeCache();

// GET /api/news - Pure cache read, never triggers fetch
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Calculate cache age for logging
    const cacheAge = cacheTimestamp ? Math.round((Date.now() - cacheTimestamp) / 1000) : null;

    // Always read from cache - never trigger fetch
    let articles = [...cachedArticles]; // Shallow copy for filtering

    if (articles.length === 0) {
      console.log(`📭 Cache empty (ready: ${cacheReady}, age: ${cacheAge}s) - returning empty list`);
    } else {
      console.log(`✅ Serving ${articles.length} cached articles (age: ${cacheAge}s)`);
    }

    // Filter by category if specified
    if (category) {
      articles = articles.filter(article =>
        article.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Paginate (cache is already sorted by date)
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedArticles = articles.slice(start, end);

    res.json({
      articles: paginatedArticles,
      hasMore: end < articles.length,
      total: articles.length,
      page: pageNum,
      limit: limitNum,
      cacheReady: cacheReady,
      cacheAge: cacheAge
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

// POST /api/news/refresh-cache - Force refresh the news cache (admin only)
router.post('/refresh-cache', async (req, res) => {
  try {
    console.log('🔄 Manual cache refresh requested');

    // Fetch fresh articles first (don't clear cache until we have new data)
    const fetchedArticles = await fetchFromWordPressAPI(CACHE_MAX_SIZE);

    // Merge new articles into cache (or replace entirely for manual refresh)
    const previousCount = cachedArticles.length;
    const { addedCount, updatedCount } = mergeArticlesIntoCache(fetchedArticles);
    cacheTimestamp = Date.now();

    console.log(`✅ Manual cache refresh complete: ${addedCount} new, ${updatedCount} updated, ${cachedArticles.length} total`);

    res.json({
      success: true,
      message: `Cache refreshed successfully.`,
      previousCount: previousCount,
      currentCount: cachedArticles.length,
      added: addedCount,
      updated: updatedCount
    });
  } catch (error) {
    console.error('❌ Manual cache refresh failed:', error);
    // Don't clear cache on error - keep serving existing data
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
      message: error.message,
      note: 'Existing cache preserved'
    });
  }
});

export default router;
