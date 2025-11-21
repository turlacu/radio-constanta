import express from 'express';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Settings file path
const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

// Default site domain (fallback)
const DEFAULT_SITE_DOMAIN = 'radioconstanta.ro';

// Get site domain from settings
async function getSiteDomain() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    return settings.newsSource?.siteDomain || DEFAULT_SITE_DOMAIN;
  } catch (error) {
    // Settings file doesn't exist or is invalid - use default
    return DEFAULT_SITE_DOMAIN;
  }
}

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

// Helper to rewrite image URLs in HTML content to use our proxy
const proxyImagesInHtml = (html) => {
  if (!html) return html;

  // Replace src attributes in img tags
  return html.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, src, after) => {
      const proxiedSrc = proxyImageUrl(src);
      return `<img${before}src="${proxiedSrc}"${after}>`;
    }
  );
};

// GET /api/article?url=...
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Get allowed site domain from settings
    const siteDomain = await getSiteDomain();

    // Validate URL is from the configured site domain
    if (!url.includes(siteDomain)) {
      return res.status(400).json({ error: `Invalid URL domain. Expected: ${siteDomain}` });
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

    // Proxy all images to prevent tracking prevention errors
    const proxiedContent = proxyImagesInHtml(articleContent);
    const proxiedImage = proxyImageUrl(featuredImage);

    console.log('Successfully extracted article content');

    res.json({
      content: proxiedContent,
      image: proxiedImage,
      success: true
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      error: 'Failed to fetch article content',
      message: error.message
    });
  }
});

export default router;
