import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

const RSS_URL = 'https://www.radioconstanta.ro/rss';

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

        // Extract image from enclosure or content
        let image = null;
        if (item.enclosure && item.enclosure[0] && item.enclosure[0].url) {
          image = item.enclosure[0].url;
        } else {
          // Try to extract from content:encoded or description
          const content = extractText(item['content:encoded']) || description;
          const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
          if (imgMatch) {
            image = imgMatch[1];
          }
        }

        // Clean up image URL
        if (image) {
          // Remove query parameters and get higher res version
          image = image.split('?')[0];
          image = image.replace(/-300x\d+\./i, '-1024x683.');
          image = image.replace(/-\d+x\d+\./i, '.');
        }

        // Get full content
        const content = extractText(item['content:encoded']) || description;

        return {
          id: guid,
          title: stripHtml(title),
          summary: stripHtml(description).substring(0, 200),
          image: image || 'https://via.placeholder.com/768x432/1A1A1A/00BFFF?text=Radio+Constanta',
          category: stripHtml(category),
          date: parseRomanianDate(pubDate),
          link: link,
          content: content,
          author: stripHtml(creator)
        };
      } catch (err) {
        console.error('Error parsing RSS item:', err);
        return null;
      }
    }).filter(article => article !== null && article.title && article.link);

    console.log(`Successfully parsed ${articles.length} articles`);
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

    // Fetch and parse RSS feed
    let articles = await parseRSSFeed();

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
