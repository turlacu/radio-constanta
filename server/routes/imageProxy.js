import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Settings file path
const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

// Cache control settings
const CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Default allowed image domains (fallback)
const DEFAULT_ALLOWED_DOMAINS = [
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'radioconstanta.ro',
  'www.radioconstanta.ro'
];

// Get allowed image domains from settings
async function getAllowedImageDomains() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    // Get domains from settings, or use defaults
    const configuredDomains = settings.newsSource?.allowedImageDomains;
    if (Array.isArray(configuredDomains) && configuredDomains.length > 0) {
      return configuredDomains;
    }
    return DEFAULT_ALLOWED_DOMAINS;
  } catch (error) {
    // Settings file doesn't exist or is invalid - use defaults
    return DEFAULT_ALLOWED_DOMAINS;
  }
}

// GET /api/image-proxy?url=...
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Get allowed domains from settings
    const allowedDomains = await getAllowedImageDomains();

    const urlObj = new URL(url);
    const isAllowedDomain = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      return res.status(400).json({ error: 'Invalid image domain' });
    }

    console.log(`Proxying image: ${url}`);

    // Fetch image from original source
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get content type from response
    const contentType = response.headers.get('content-type');

    // Validate it's actually an image
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${CACHE_DURATION}, immutable`,
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*'
    });

    // Stream the image to the client
    const imageBuffer = await response.arrayBuffer();
    res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({
      error: 'Failed to proxy image',
      message: error.message
    });
  }
});

export default router;
