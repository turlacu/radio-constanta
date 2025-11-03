import * as cheerio from 'cheerio';

// Fetch and extract full article content from Radio Constanta article page
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
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL is from radioconstanta.ro
    if (!url.includes('radioconstanta.ro')) {
      return res.status(400).json({ error: 'Invalid URL domain' });
    }

    console.log(`Fetching full article from: ${url}`);

    // Fetch article page
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract article content from Radio Constanta's structure
    // Content is within <article class="articol"> after the intro
    const article = $('article.articol');

    if (!article.length) {
      throw new Error('Could not find article element');
    }

    // Extract content in the order it appears, preserving paragraphs, figures, audio, iframes, etc.
    // We want to maintain the natural flow of the article
    let articleContent = '';
    let firstFigureSkipped = false;

    // Get all content elements within the article
    article.children().each((i, elem) => {
      const $elem = $(elem);
      const tagName = elem.tagName.toLowerCase();

      // Skip intro paragraph and author/date metadata
      if ($elem.hasClass('articol__intro') || $elem.hasClass('articol__autor-data')) {
        return;
      }

      // Handle figures (images, audio players)
      if (tagName === 'figure') {
        // Skip the first figure (featured image)
        if (!firstFigureSkipped) {
          firstFigureSkipped = true;
          return;
        }
        articleContent += $.html(elem);
        return;
      }

      // Include paragraphs
      if (tagName === 'p') {
        articleContent += $.html(elem);
        return;
      }

      // Include divs that might contain embedded media (audio/video)
      if (tagName === 'div') {
        // Include divs with media-related classes
        const className = $elem.attr('class') || '';
        if (className.includes('wp-audio') || className.includes('wp-video') ||
            className.includes('wp-embed') || className.includes('widget-live')) {
          articleContent += $.html(elem);
          return;
        }
      }

      // Include iframes (for embedded content)
      if (tagName === 'iframe') {
        articleContent += $.html(elem);
        return;
      }

      // Include other block-level content elements
      if (['blockquote', 'ul', 'ol', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'table'].includes(tagName)) {
        articleContent += $.html(elem);
        return;
      }
    });

    if (!articleContent || articleContent.trim().length < 50) {
      throw new Error('Article content too short or empty');
    }

    // Extract featured image if available
    let featuredImage = null;
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      // Get higher resolution image (768px for article view)
      const baseUrl = ogImage.split('?')[0];
      featuredImage = `${baseUrl}?w=768&quality=85`;
    }

    console.log('Successfully extracted article content');

    res.status(200).json({
      content: articleContent,
      image: featuredImage,
      success: true
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      error: 'Failed to fetch article content',
      message: error.message
    });
  }
}
