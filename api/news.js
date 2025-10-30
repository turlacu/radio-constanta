import * as cheerio from 'cheerio';

const NEWS_URLS = {
  stiri: 'https://www.radioconstanta.ro/articole/stiri/',
  externe: 'https://www.radioconstanta.ro/articole/externe/'
};

// Helper to parse Romanian month names
const parseRomanianDate = (dateStr) => {
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

// Scrape articles from a single page
const scrapeArticles = async (url, category) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];

    // Find all article containers - adjust selector based on actual HTML
    // This is a generic approach that should work with most WordPress themes
    $('article, .article, .post, .entry').each((index, element) => {
      try {
        const $article = $(element);

        // Extract title
        const $title = $article.find('h2 a, h3 a, .entry-title a, .article-title a').first();
        const title = $title.text().trim();
        const link = $title.attr('href');

        // Extract image
        const $img = $article.find('img').first();
        let image = $img.attr('src') || $img.attr('data-src');

        // Upgrade image size if it's a WordPress thumbnail
        if (image) {
          image = image.replace(/-150x\d+\./, '-768x432.')
                       .replace(/-300x\d+\./, '-768x432.')
                       .replace(/-410x\d+\./, '-768x432.');
        }

        // Extract excerpt/description
        const excerpt = $article.find('.entry-excerpt, .excerpt, p').first().text().trim();

        // Extract date
        const dateText = $article.find('.entry-date, .date, time, .published').first().text().trim();
        const date = dateText ? parseRomanianDate(dateText) : new Date().toISOString();

        // Only add if we have at least title and link
        if (title && link) {
          articles.push({
            id: link.split('/').filter(Boolean).pop() || `article-${index}`,
            title,
            summary: excerpt.substring(0, 200),
            image: image || 'https://via.placeholder.com/768x432/1A1A1A/00BFFF?text=Radio+Constanta',
            category,
            date,
            link: link.startsWith('http') ? link : `https://www.radioconstanta.ro${link}`,
            author: 'Radio Constanta'
          });
        }
      } catch (err) {
        console.error('Error parsing article:', err);
      }
    });

    return articles;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
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

    // Fetch articles from both categories (or specific category if requested)
    let allArticles = [];

    if (!category || category === 'stiri') {
      const stiriArticles = await scrapeArticles(NEWS_URLS.stiri, 'Știri');
      allArticles = [...allArticles, ...stiriArticles];
    }

    if (!category || category === 'externe') {
      const externeArticles = await scrapeArticles(NEWS_URLS.externe, 'Externe');
      allArticles = [...allArticles, ...externeArticles];
    }

    // Sort by date (newest first)
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Remove duplicates based on link
    const uniqueArticles = allArticles.filter((article, index, self) =>
      index === self.findIndex((a) => a.link === article.link)
    );

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedArticles = uniqueArticles.slice(start, end);

    res.status(200).json({
      articles: paginatedArticles,
      hasMore: end < uniqueArticles.length,
      total: uniqueArticles.length,
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
