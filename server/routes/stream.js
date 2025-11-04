import { Router } from 'express';
import https from 'https';
import http from 'http';

const router = Router();

// Stream configuration - maps quality IDs to upstream URLs
const STREAMS = {
  fm: {
    '128': 'http://stream2.srr.ro:8330/radio-constanta-fm',
    '256': 'http://stream2.srr.ro:8332/radio-constanta-fm',
    'flac': 'http://89.238.207.222:8008/radio-constanta-flac'
  },
  folclor: {
    '128': 'http://stream2.srr.ro:8334/radio-constanta-am',
    '256': 'http://stream2.srr.ro:8336/radio-constanta-am'
  }
};

// Helper to proxy stream and strip ICY metadata
const proxyStream = (req, res, upstreamUrl) => {
  console.log(`[Stream Proxy] Proxying: ${upstreamUrl}`);

  const protocol = upstreamUrl.startsWith('https') ? https : http;

  // Request upstream stream
  const proxyReq = protocol.get(upstreamUrl, {
    headers: {
      'User-Agent': 'Radio Constanta Mobile App/1.0',
      'Icy-MetaData': '0' // Disable ICY metadata
    }
  }, (upstreamRes) => {
    console.log(`[Stream Proxy] Upstream status: ${upstreamRes.statusCode}`);

    // Set response headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Accept-Ranges', 'none');

    // Don't include ICY metadata headers in response
    res.setHeader('icy-metaint', '0');

    // Pipe the upstream audio data to client
    upstreamRes.pipe(res);

    // Handle upstream errors
    upstreamRes.on('error', (err) => {
      console.error('[Stream Proxy] Upstream error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Stream error' });
      }
    });
  });

  // Handle request errors
  proxyReq.on('error', (err) => {
    console.error('[Stream Proxy] Request error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to connect to stream' });
    }
  });

  // Clean up on client disconnect
  req.on('close', () => {
    console.log('[Stream Proxy] Client disconnected');
    proxyReq.destroy();
  });
};

// FM stream endpoints
router.get('/fm/:quality', (req, res) => {
  const { quality } = req.params;
  const streamUrl = STREAMS.fm[quality];

  if (!streamUrl) {
    return res.status(404).json({
      error: 'Quality not found',
      available: Object.keys(STREAMS.fm)
    });
  }

  proxyStream(req, res, streamUrl);
});

// Folclor stream endpoints
router.get('/folclor/:quality', (req, res) => {
  const { quality } = req.params;
  const streamUrl = STREAMS.folclor[quality];

  if (!streamUrl) {
    return res.status(404).json({
      error: 'Quality not found',
      available: Object.keys(STREAMS.folclor)
    });
  }

  proxyStream(req, res, streamUrl);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    streams: {
      fm: Object.keys(STREAMS.fm),
      folclor: Object.keys(STREAMS.folclor)
    }
  });
});

export default router;
