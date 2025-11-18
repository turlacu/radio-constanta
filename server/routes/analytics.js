import express from 'express';
import jwt from 'jsonwebtoken';
import {
  startSession,
  updateHeartbeat,
  endSession,
  switchStation,
  changeQuality,
  logArticleView,
  getCurrentStats,
  getDailyStats,
  getTodayStats,
  getMostViewedArticles
} from '../database/analytics.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token for admin endpoints
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// === PUBLIC TRACKING ENDPOINTS ===

// Log stream event (start, stop, switch, quality change)
router.post('/stream-event', (req, res) => {
  try {
    const { sessionId, event, station, quality } = req.body;

    if (!sessionId || !event) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, event' });
    }

    switch (event) {
      case 'start':
        if (!station || !quality) {
          return res.status(400).json({ error: 'Missing station or quality for start event' });
        }
        startSession(sessionId, station, quality);
        break;

      case 'stop':
        endSession(sessionId);
        break;

      case 'switch_station':
        if (!station) {
          return res.status(400).json({ error: 'Missing station for switch event' });
        }
        switchStation(sessionId, station, quality);
        break;

      case 'change_quality':
        if (!quality) {
          return res.status(400).json({ error: 'Missing quality for quality change event' });
        }
        changeQuality(sessionId, station, quality);
        break;

      default:
        return res.status(400).json({ error: 'Invalid event type' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging stream event:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// Update session heartbeat
router.post('/heartbeat', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    updateHeartbeat(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// Log article view
router.post('/article-view', (req, res) => {
  try {
    const { articleId, title } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Missing articleId' });
    }

    logArticleView(articleId, title || 'Unknown');
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging article view:', error);
    res.status(500).json({ error: 'Failed to log article view' });
  }
});

// === ADMIN ENDPOINTS (Protected) ===

// Get current real-time statistics
router.get('/admin/current', authenticateAdmin, (req, res) => {
  try {
    const stats = getCurrentStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting current stats:', error);
    res.status(500).json({ error: 'Failed to get current stats' });
  }
});

// Get today's statistics
router.get('/admin/today', authenticateAdmin, (req, res) => {
  try {
    const stats = getTodayStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting today stats:', error);
    res.status(500).json({ error: 'Failed to get today stats' });
  }
});

// Get daily statistics for a date range
router.get('/admin/daily', authenticateAdmin, (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date parameters' });
    }

    const stats = getDailyStats(start, end);
    res.json(stats);
  } catch (error) {
    console.error('Error getting daily stats:', error);
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

// Get most viewed articles
router.get('/admin/articles', authenticateAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;

    const articles = getMostViewedArticles(limit, days);
    res.json(articles);
  } catch (error) {
    console.error('Error getting article stats:', error);
    res.status(500).json({ error: 'Failed to get article stats' });
  }
});

// Export statistics as CSV
router.get('/admin/export', authenticateAdmin, (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date parameters' });
    }

    const stats = getDailyStats(start, end);

    // Generate CSV
    const headers = [
      'Date',
      'Total Listeners',
      'Peak Listeners',
      'Avg Listeners',
      'FM Listeners',
      'Folclor Listeners',
      'MP3 128kbps',
      'MP3 256kbps',
      'FLAC',
      'Article Views',
      'Total Sessions'
    ];

    const rows = stats.map(stat => [
      stat.date,
      stat.total_listeners,
      stat.peak_listeners,
      stat.avg_listeners,
      stat.fm_listeners,
      stat.folclor_listeners,
      stat.mp3_128_count,
      stat.mp3_256_count,
      stat.flac_count,
      stat.article_views,
      stat.total_sessions
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="radio-stats-${start}-to-${end}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting stats:', error);
    res.status(500).json({ error: 'Failed to export stats' });
  }
});

export default router;
