import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/analytics.db');

let db = null;

// Initialize database and create tables
export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await mkdir(path.dirname(DB_PATH), { recursive: true });

    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');

    // Create tables
    db.exec(`
      -- Active listener sessions
      CREATE TABLE IF NOT EXISTS listener_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_id TEXT,
        station TEXT NOT NULL,
        quality TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        last_heartbeat INTEGER NOT NULL,
        ended_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_session_id ON listener_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_active_sessions ON listener_sessions(ended_at) WHERE ended_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_started_at ON listener_sessions(started_at);

      -- Stream events (start, stop, switch, quality change)
      CREATE TABLE IF NOT EXISTS stream_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        station TEXT,
        quality TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_event_timestamp ON stream_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_event_type ON stream_events(event_type);

      -- Article views
      CREATE TABLE IF NOT EXISTS article_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id TEXT NOT NULL,
        article_title TEXT,
        view_date TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_article_id ON article_views(article_id);
      CREATE INDEX IF NOT EXISTS idx_view_date ON article_views(view_date);

      -- Daily aggregated statistics
      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        total_listeners INTEGER DEFAULT 0,
        peak_listeners INTEGER DEFAULT 0,
        avg_listeners INTEGER DEFAULT 0,
        fm_listeners INTEGER DEFAULT 0,
        folclor_listeners INTEGER DEFAULT 0,
        mp3_128_count INTEGER DEFAULT 0,
        mp3_256_count INTEGER DEFAULT 0,
        flac_count INTEGER DEFAULT 0,
        article_views INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0
      );
    `);

    // Migration: Add user_id column if it doesn't exist
    const tableInfo = db.prepare("PRAGMA table_info(listener_sessions)").all();
    const hasUserId = tableInfo.some(col => col.name === 'user_id');
    if (!hasUserId) {
      console.log('[Analytics] Migrating: Adding user_id column to listener_sessions...');
      db.exec(`ALTER TABLE listener_sessions ADD COLUMN user_id TEXT`);
      console.log('[Analytics] Migration complete: user_id column added');
    }

    // Create user_id index if it doesn't exist (safe to run multiple times)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_user_id ON listener_sessions(user_id)`);

    console.log('✅ Analytics database initialized:', DB_PATH);
  } catch (error) {
    console.error('Error initializing analytics database:', error);
    throw error;
  }
}

// Get database instance
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// === SESSION TRACKING ===

// Start a new listening session
export function startSession(sessionId, userId, station, quality) {
  const db = getDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO listener_sessions (session_id, user_id, station, quality, started_at, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(sessionId, userId, station, quality, now, now);

    // Log event
    logStreamEvent(sessionId, 'start', station, quality);
  } catch (error) {
    console.error('Error starting session:', error);
  }
}

// Update session heartbeat (keep alive)
export function updateHeartbeat(sessionId) {
  const db = getDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      UPDATE listener_sessions
      SET last_heartbeat = ?
      WHERE session_id = ? AND ended_at IS NULL
    `);
    stmt.run(now, sessionId);
  } catch (error) {
    console.error('Error updating heartbeat:', error);
  }
}

// End a listening session
export function endSession(sessionId) {
  const db = getDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      UPDATE listener_sessions
      SET ended_at = ?
      WHERE session_id = ? AND ended_at IS NULL
    `);
    const result = stmt.run(now, sessionId);

    if (result.changes > 0) {
      // Get session info to log the event
      const session = db.prepare('SELECT station, quality FROM listener_sessions WHERE session_id = ?').get(sessionId);
      if (session) {
        logStreamEvent(sessionId, 'stop', session.station, session.quality);
      }
    }
  } catch (error) {
    console.error('Error ending session:', error);
  }
}

// Update session when station changes
export function switchStation(sessionId, userId, newStation, quality) {
  const db = getDatabase();
  const now = Date.now();

  try {
    // Get user_id from existing session if not provided
    if (!userId) {
      const existingSession = db.prepare('SELECT user_id FROM listener_sessions WHERE session_id = ? AND ended_at IS NULL').get(sessionId);
      userId = existingSession?.user_id;
    }

    // End the current session
    const endStmt = db.prepare(`
      UPDATE listener_sessions
      SET ended_at = ?, last_heartbeat = ?
      WHERE session_id = ? AND ended_at IS NULL
    `);
    endStmt.run(now, now, sessionId);

    // Start a new session with the new station
    const startStmt = db.prepare(`
      INSERT INTO listener_sessions (session_id, user_id, station, quality, started_at, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    startStmt.run(sessionId, userId, newStation, quality, now, now);

    logStreamEvent(sessionId, 'switch_station', newStation, quality);
  } catch (error) {
    console.error('Error switching station:', error);
  }
}

// Update session when quality changes
export function changeQuality(sessionId, userId, station, newQuality) {
  const db = getDatabase();
  const now = Date.now();

  try {
    // Get user_id from existing session if not provided
    if (!userId) {
      const existingSession = db.prepare('SELECT user_id FROM listener_sessions WHERE session_id = ? AND ended_at IS NULL').get(sessionId);
      userId = existingSession?.user_id;
    }

    // End the current session
    const endStmt = db.prepare(`
      UPDATE listener_sessions
      SET ended_at = ?, last_heartbeat = ?
      WHERE session_id = ? AND ended_at IS NULL
    `);
    endStmt.run(now, now, sessionId);

    // Start a new session with the new quality
    const startStmt = db.prepare(`
      INSERT INTO listener_sessions (session_id, user_id, station, quality, started_at, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    startStmt.run(sessionId, userId, station, newQuality, now, now);

    logStreamEvent(sessionId, 'change_quality', station, newQuality);
  } catch (error) {
    console.error('Error changing quality:', error);
  }
}

// Log a stream event
export function logStreamEvent(sessionId, eventType, station, quality) {
  const db = getDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO stream_events (session_id, event_type, station, quality, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(sessionId, eventType, station, quality, Date.now());
  } catch (error) {
    console.error('Error logging stream event:', error);
  }
}

// === ARTICLE TRACKING ===

// Log article view
export function logArticleView(articleId, articleTitle) {
  const db = getDatabase();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const stmt = db.prepare(`
      INSERT INTO article_views (article_id, article_title, view_date, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(articleId, articleTitle, dateStr, now.getTime());
  } catch (error) {
    console.error('Error logging article view:', error);
  }
}

// === CLEANUP ===

// Clean up stale sessions (no heartbeat in 5 minutes)
export function cleanupStaleSessions() {
  const db = getDatabase();
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

  try {
    const stmt = db.prepare(`
      UPDATE listener_sessions
      SET ended_at = last_heartbeat
      WHERE ended_at IS NULL AND last_heartbeat < ?
    `);
    const result = stmt.run(fiveMinutesAgo);

    if (result.changes > 0) {
      console.log(`[Analytics] Cleaned up ${result.changes} stale session(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up stale sessions:', error);
  }
}

// === CURRENT STATS ===

// Get current active listeners
export function getCurrentStats() {
  const db = getDatabase();

  try {
    // Clean up stale sessions first
    cleanupStaleSessions();

    // Get active sessions count by station
    const stationStats = db.prepare(`
      SELECT
        station,
        COUNT(*) as count
      FROM listener_sessions
      WHERE ended_at IS NULL
      GROUP BY station
    `).all();

    // Get active sessions count by quality
    const qualityStats = db.prepare(`
      SELECT
        quality,
        COUNT(*) as count
      FROM listener_sessions
      WHERE ended_at IS NULL
      GROUP BY quality
    `).all();

    // Get total active sessions
    const totalActive = db.prepare(`
      SELECT COUNT(*) as count
      FROM listener_sessions
      WHERE ended_at IS NULL
    `).get();

    // Get unique active users count
    const uniqueUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM listener_sessions
      WHERE ended_at IS NULL AND user_id IS NOT NULL
    `).get();

    return {
      total: totalActive.count,
      uniqueUsers: uniqueUsers.count,
      byStation: stationStats.reduce((acc, row) => {
        acc[row.station] = row.count;
        return acc;
      }, {}),
      byQuality: qualityStats.reduce((acc, row) => {
        acc[row.quality] = row.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting current stats:', error);
    return { total: 0, uniqueUsers: 0, byStation: {}, byQuality: {} };
  }
}

// === HISTORICAL STATS ===

// Get daily stats for a date range
export function getDailyStats(startDate, endDate) {
  const db = getDatabase();

  try {
    const stmt = db.prepare(`
      SELECT
        date,
        total_listeners,
        peak_listeners,
        avg_listeners,
        fm_listeners,
        folclor_listeners,
        mp3_128_count as mp3_128_listeners,
        mp3_256_count as mp3_256_listeners,
        flac_count as flac_listeners,
        article_views,
        total_sessions
      FROM daily_stats
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `);
    return stmt.all(startDate, endDate);
  } catch (error) {
    console.error('Error getting daily stats:', error);
    return [];
  }
}

// Get today's stats (live + historical)
export function getTodayStats() {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today).getTime();
  const tomorrowStart = todayStart + (24 * 60 * 60 * 1000);

  try {
    // Get current live stats (for current listeners count)
    const current = getCurrentStats();

    // Count total sessions that started today (both active and ended)
    const totalSessions = db.prepare(`
      SELECT COUNT(*) as count
      FROM listener_sessions
      WHERE started_at >= ? AND started_at < ?
    `).get(todayStart, tomorrowStart);

    // Count unique users today
    const uniqueUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM listener_sessions
      WHERE started_at >= ? AND started_at < ? AND user_id IS NOT NULL
    `).get(todayStart, tomorrowStart);

    // Count sessions by station for today
    const stationStats = db.prepare(`
      SELECT
        station,
        COUNT(*) as count
      FROM listener_sessions
      WHERE started_at >= ? AND started_at < ?
      GROUP BY station
    `).all(todayStart, tomorrowStart);

    const fmCount = stationStats.find(s => s.station === 'fm')?.count || 0;
    const folclorCount = stationStats.find(s => s.station === 'folclor')?.count || 0;

    // Count sessions by quality for today
    const qualityStats = db.prepare(`
      SELECT
        quality,
        COUNT(*) as count
      FROM listener_sessions
      WHERE started_at >= ? AND started_at < ?
      GROUP BY quality
    `).all(todayStart, tomorrowStart);

    const mp3_128Count = qualityStats.find(q => q.quality === 'mp3_128')?.count || 0;
    const mp3_256Count = qualityStats.find(q => q.quality === 'mp3_256')?.count || 0;
    const flacCount = qualityStats.find(q => q.quality === 'flac')?.count || 0;

    // Get article views today
    const articleViews = db.prepare(`
      SELECT COUNT(*) as count
      FROM article_views
      WHERE view_date = ?
    `).get(today);

    return {
      date: today,
      current: current,
      total_listeners: totalSessions.count,
      unique_users: uniqueUsers.count,
      fm_listeners: fmCount,
      folclor_listeners: folclorCount,
      peak_listeners: Math.max(current.total, 0), // For now, use current as peak (will be updated by aggregation)
      mp3_128_listeners: mp3_128Count,
      mp3_256_listeners: mp3_256Count,
      flac_listeners: flacCount,
      article_views: articleViews.count
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    return null;
  }
}

// === ARTICLE STATS ===

// Get most viewed articles
export function getMostViewedArticles(limit = 10, days = 30) {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  try {
    const stmt = db.prepare(`
      SELECT
        article_id,
        article_title,
        COUNT(*) as view_count
      FROM article_views
      WHERE view_date >= ?
      GROUP BY article_id, article_title
      ORDER BY view_count DESC
      LIMIT ?
    `);
    return stmt.all(cutoffDateStr, limit);
  } catch (error) {
    console.error('Error getting most viewed articles:', error);
    return [];
  }
}

// === AGGREGATION ===

// Aggregate data for a specific date
export function aggregateDailyStats(dateStr) {
  const db = getDatabase();

  try {
    const startOfDay = new Date(dateStr + 'T00:00:00Z').getTime();
    const endOfDay = new Date(dateStr + 'T23:59:59Z').getTime();

    // Count total unique sessions that day
    const totalSessions = db.prepare(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM stream_events
      WHERE timestamp >= ? AND timestamp <= ?
        AND event_type = 'start'
    `).get(startOfDay, endOfDay);

    // Count by station (sessions that started that day)
    const byStation = db.prepare(`
      SELECT
        station,
        COUNT(*) as count
      FROM stream_events
      WHERE timestamp >= ? AND timestamp <= ?
        AND event_type IN ('start', 'switch_station')
      GROUP BY station
    `).all(startOfDay, endOfDay);

    // Count by quality
    const byQuality = db.prepare(`
      SELECT
        quality,
        COUNT(*) as count
      FROM stream_events
      WHERE timestamp >= ? AND timestamp <= ?
        AND event_type IN ('start', 'change_quality')
      GROUP BY quality
    `).all(startOfDay, endOfDay);

    // Count article views
    const articleViews = db.prepare(`
      SELECT COUNT(*) as count
      FROM article_views
      WHERE view_date = ?
    `).get(dateStr);

    // Prepare aggregated data
    const stats = {
      date: dateStr,
      total_listeners: totalSessions.count,
      total_sessions: totalSessions.count,
      fm_listeners: byStation.find(s => s.station === 'fm')?.count || 0,
      folclor_listeners: byStation.find(s => s.station === 'folclor')?.count || 0,
      mp3_128_count: byQuality.find(q => q.quality === 'mp3_128')?.count || 0,
      mp3_256_count: byQuality.find(q => q.quality === 'mp3_256')?.count || 0,
      flac_count: byQuality.find(q => q.quality === 'flac')?.count || 0,
      article_views: articleViews.count,
      peak_listeners: 0, // TODO: Calculate from session overlaps
      avg_listeners: 0   // TODO: Calculate average
    };

    // Insert or update daily stats
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO daily_stats
      (date, total_listeners, total_sessions, fm_listeners, folclor_listeners,
       mp3_128_count, mp3_256_count, flac_count, article_views, peak_listeners, avg_listeners)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      stats.date,
      stats.total_listeners,
      stats.total_sessions,
      stats.fm_listeners,
      stats.folclor_listeners,
      stats.mp3_128_count,
      stats.mp3_256_count,
      stats.flac_count,
      stats.article_views,
      stats.peak_listeners,
      stats.avg_listeners
    );

    console.log(`[Analytics] Aggregated stats for ${dateStr}:`, stats);
    return stats;
  } catch (error) {
    console.error('Error aggregating daily stats:', error);
    return null;
  }
}

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
    console.log('✅ Analytics database closed');
  }
}

export default {
  initializeDatabase,
  getDatabase,
  startSession,
  updateHeartbeat,
  endSession,
  switchStation,
  changeQuality,
  logArticleView,
  getCurrentStats,
  getDailyStats,
  getTodayStats,
  getMostViewedArticles,
  aggregateDailyStats,
  cleanupStaleSessions,
  closeDatabase
};
