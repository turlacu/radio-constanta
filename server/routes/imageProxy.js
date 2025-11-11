import express from 'express';

const router = express.Router();

// Cache control settings
const CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// GET /api/image-proxy?url=...
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL is from allowed domains (WordPress CDN or Radio Constanta)
    const allowedDomains = [
      'i0.wp.com',
      'i1.wp.com',
      'i2.wp.com',
      'radioconstanta.ro',
      'www.radioconstanta.ro'
    ];

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
