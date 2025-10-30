import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

const RSS_URL = 'https://www.radioconstanta.ro/rss';

// In-memory cache
let cachedArticles = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Helper to parse Romanian month names
const parseRomanianDate = (dateStr) => {
  // Try to parse standard date format first
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  // Fallback for Romanian format
  const months = {
    'ianuarie': 0, 'februarie': 1, 'martie': 2, 'aprilie': 3,
    'mai': 4, 'iunie': 5, 'iulie': 6, 'august': 7,
    'septembrie': 8, 'octombrie': 9, 'noiembrie': 10, 'decembrie': 11
  };

  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = months[match[2].toLowerCase()] || 0;
    const year = parseInt(match[3]);
    return new Date(year, month, day).toISOString();
  }

  return new Date().toISOString();
};

// Helper to extract text from CDATA or regular text
const extractText = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'object' && value._) {
    return value._.trim();
  }
  return String(value).trim();
};

// Helper to clean HTML tags from text
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
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to clean article content - remove WordPress footer and add Read More link
const cleanArticleContent = (html, articleLink) => {
  if (!html) return '';

  // Remove WordPress "Articolul ... apare prima dată în..." footer
  html = html.replace(/<p>Articolul\s+<a[^>]*>.*?<\/a>\s+apare prima dată în\s+<a[^>]*>.*?<\/a>\.<\/p>/gi, '');
  html = html.replace(/Articolul\s+.*?\s+apare prima dată în\s+.*?\./gi, '');

  // Replace […] or &#8230; with "Read More" link
  const readMoreLink = `<a href="${articleLink}" target="_blank" rel="noopener noreferrer" style="color: #00BFFF; text-decoration: underline;">Citește mai mult pe www.radioconstanta.ro</a>`;

  html = html.replace(/\[…\]/g, readMoreLink);
  html = html.replace(/&#8230;/g, readMoreLink);
  html = html.replace(/\.\.\./g, readMoreLink);

  return html.trim();
};

// Parse RSS feed
const parseRSSFeed = async () => {
  try {
    console.log('Fetching RSS feed...');
    const response = await fetch(RSS_URL);

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    let xmlText = await response.text();
    console.log(`RSS XML length: ${xmlText.length} bytes`);

    // Fix malformed XML - escape unescaped ampersands
    xmlText = xmlText.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

    // Parse XML
    const result = await parseXML(xmlText, {
      trim: true,
      explicitArray: true,
      mergeAttrs: true
    });

    const items = result?.rss?.channel?.[0]?.item || [];
    console.log(`Found ${items.length} items in RSS feed`);

    const articles = items.map((item, index) => {
      try {
        // Extract basic fields
        const title = extractText(item.title);
        const link = extractText(item.link);
        const description = extractText(item.description);
        const pubDate = extractText(item.pubDate);
        const guid = extractText(item.guid) || `article-${index}`;

        // Extract creator
        const creator = extractText(item['dc:creator']) || 'Radio Constanta';

        // Extract categories
        const categories = item.category || [];
        const categoryNames = categories.map(c => extractText(c));
        const category = categoryNames[0] || 'Actualitate';

        // Extract image from RSS enclosure tag (instant, no HTTP request needed)
        let image = null;
        if (item.enclosure && item.enclosure[0] && item.enclosure[0].url) {
          image = extractText(item.enclosure[0].url);
          if (image) {
            // Clean up WordPress CDN URL - remove resize parameters to get original size
            image = image.split('?')[0];
          }
        }

        // Use placeholder if no image in RSS
        if (!image) {
          image = 'https://via.placeholder.com/768x432/1A1A1A/00BFFF?text=Radio+Constanta';
        }

        // Get full content and clean it
        const rawContent = extractText(item['content:encoded']) || description;
        const cleanedContent = cleanArticleContent(rawContent, link);
        const cleanedDescription = cleanArticleContent(description, link);

        return {
          id: guid,
          title: stripHtml(title),
          summary: stripHtml(cleanedDescription).substring(0, 250),
          image: image,
          category: stripHtml(category),
          date: parseRomanianDate(pubDate),
          link: link,
          content: cleanedContent,
          author: stripHtml(creator)
        };
      } catch (err) {
        console.error('Error parsing RSS item:', err);
        return null;
      }
    }).filter(article => article !== null && article.title && article.link);

    const articlesWithImages = articles.filter(a => !a.image.includes('placeholder')).length;
    console.log(`Successfully parsed ${articles.length} articles (${articlesWithImages} with images from RSS)`);
    return articles;

  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw error;
  }
};

// Main API handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        // Fetch and parse RSS feed
        articles = await parseRSSFeed();

        // Update cache
        cachedArticles = articles;
        cacheTimestamp = now;
        console.log(`Cache updated with ${articles.length} articles`);
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

    res.status(200).json({
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
}
