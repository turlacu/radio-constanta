import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import ntpClient from 'ntp-client';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticateAdmin, getJWTSecret } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getNowPlayingState } from './nowplaying.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const VALID_STATIONS = new Set(['fm', 'folclor']);

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('[Auth]', `Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many login attempts. Please try again later.',
    });
  },
});

// Configure multer for cover uploads
// Store in server/data/covers for persistence across deployments
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const station = req.params.station || 'fm';

    if (!validateStationParam(station)) {
      cb(new Error('Invalid station'));
      return;
    }

    const uploadPath = path.join(__dirname, '../data/covers', station);

    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${sanitizeUploadFilename(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function normalizePasswordHash(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

// Admin password from environment variable
const ENV_PASSWORD_HASH = normalizePasswordHash(process.env.ADMIN_PASSWORD_HASH);

const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');
const COVERS_DIR = path.join(__dirname, '../data/covers');

const streamConfigSchema = z.object({
  enabled: z.boolean(),
  url: z.string(),
  label: z.string(),
  format: z.string(),
  bitrate: z.string(),
  alacUrl: z.string().optional(),
});

const coverSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  path: z.string(),
  filename: z.string(),
  size: z.number().nonnegative(),
  category: z.enum(['default', 'scheduling']).or(z.string()),
  uploadedAt: z.string(),
});

const scheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  coverPath: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  videoUrl: z.string().optional(),
  videoLabel: z.string().optional(),
  muted: z.boolean().optional(),
  aspectRatio: z.enum(['16:9']).optional(),
  days: z.array(z.number().int().min(0).max(6)),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  priority: z.number().optional(),
  type: z.enum(['regular', 'news']).optional(),
  newsHours: z.array(z.number().int().min(0).max(23)).optional(),
  duration: z.number().positive().optional(),
  endOnFirstTrack: z.boolean().optional(),
});

const coverSchedulingStationSchema = z.object({
  enabled: z.boolean(),
  defaultCover: z.string(),
  transitionEffect: z.string().optional(),
  transitionDuration: z.number().nonnegative().optional(),
  covers: z.array(coverSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
});

const ntpServerSchema = z.object({
  id: z.string(),
  hostname: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  enabled: z.boolean(),
  priority: z.number().int().min(1),
});

const nowPlayingOverrideScheduleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  text: z.string().min(1),
  days: z.array(z.number().int().min(0).max(6)),
  startTime: z.string(),
  endTime: z.string(),
  priority: z.number().optional(),
  enabled: z.boolean().default(true),
});

const nowPlayingStationSchema = z.object({
  enabled: z.boolean(),
  overrideSchedules: z.array(nowPlayingOverrideScheduleSchema).default([]),
});

const adminSettingsSchema = z.object({
  weatherProvider: z.enum(['openmeteo', 'openweathermap']).default('openmeteo'),
  weatherApiKey: z.string().default(''),
  newsSource: z.object({
    wordpressApiUrl: z.string().url(),
    siteDomain: z.string().min(1),
    siteName: z.string().min(1),
    allowedImageDomains: z.array(z.string().min(1)).default([]),
  }),
  radioStreams: z.object({
    fm: z.object({
      mp3_128: streamConfigSchema,
      mp3_256: streamConfigSchema,
      flac: streamConfigSchema,
    }),
    folclor: z.object({
      mp3_128: streamConfigSchema,
      mp3_256: streamConfigSchema,
      flac: streamConfigSchema,
    }),
  }),
  defaultLocation: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    name: z.string().min(1),
  }),
  apiBaseUrl: z.string().default(''),
  coverScheduling: z.object({
    fm: coverSchedulingStationSchema,
    folclor: coverSchedulingStationSchema,
  }),
  nowPlaying: z.object({
    fm: nowPlayingStationSchema.default({ enabled: true, overrideSchedules: [] }),
    folclor: nowPlayingStationSchema.default({ enabled: false, overrideSchedules: [] }),
  }).default({
    fm: { enabled: true, overrideSchedules: [] },
    folclor: { enabled: false, overrideSchedules: [] },
  }),
  timeSynchronization: z.object({
    enabled: z.boolean(),
    ntpServers: z.array(ntpServerSchema),
    timezone: z.string().min(1),
    syncInterval: z.number().int().positive(),
    lastSync: z.string().nullable(),
    syncStatus: z.string(),
  }),
  security: z.object({
    passwordHash: z.string().optional(),
  }).optional(),
});

// Get admin password hash.
// In production deployments, an explicit environment variable should win over persisted settings
// so operators can recover access without editing mounted volumes.
async function getPasswordHash() {
  if (ENV_PASSWORD_HASH) {
    return ENV_PASSWORD_HASH;
  }

  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    // Check if password hash exists in settings file
    if (settings.security && settings.security.passwordHash) {
      return normalizePasswordHash(settings.security.passwordHash);
    }
  } catch (error) {
    // Settings file doesn't exist or doesn't have password - use env var
  }

  return '';
}

// SSE: Track connected clients for cover updates
const coverStreamClients = new Set();
const MAX_SSE_CLIENTS = 100; // Prevent memory issues
let lastKnownCovers = { fm: null, folclor: null };
const endedNewsCoverWindows = new Set();

// Helper function to validate file paths are within allowed directory
function validateFilePath(filePath, allowedDir) {
  const absolute = path.resolve(filePath);
  const allowed = path.resolve(allowedDir);
  const relative = path.relative(allowed, absolute);

  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function validateStationParam(station) {
  return VALID_STATIONS.has(station);
}

function sanitizeUploadFilename(originalname) {
  const parsed = path.parse(originalname);
  const safeName = parsed.name.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'cover';
  const safeExt = parsed.ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10).toLowerCase();
  return `${safeName}${safeExt}`;
}

function hasMusicTrackAfterScheduleStart(station, scheduleStartMs) {
  const nowPlaying = getNowPlayingState()[station];
  if (!nowPlaying?.updatedAt || !nowPlaying.artist || !nowPlaying.title) {
    return false;
  }

  const updatedAtMs = new Date(nowPlaying.updatedAt).getTime();
  return Number.isFinite(updatedAtMs) && updatedAtMs >= scheduleStartMs;
}

function getNewsCoverWindowKey(station, scheduleId, scheduleStartMs) {
  return `${station}:${scheduleId}:${scheduleStartMs}`;
}

function hasEndedNewsCoverWindow(station, scheduleId, scheduleStartMs) {
  return endedNewsCoverWindows.has(getNewsCoverWindowKey(station, scheduleId, scheduleStartMs));
}

function markEndedNewsCoverWindow(station, scheduleId, scheduleStartMs) {
  endedNewsCoverWindows.add(getNewsCoverWindowKey(station, scheduleId, scheduleStartMs));

  if (endedNewsCoverWindows.size > 500) {
    const keysToDelete = Array.from(endedNewsCoverWindows).slice(0, endedNewsCoverWindows.size - 500);
    keysToDelete.forEach((key) => endedNewsCoverWindows.delete(key));
  }
}

function buildCoverMedia(station, coverPath) {
  const path = coverPath || (station === 'fm' ? '/rcfm.png' : '/rcf.png');

  return {
    type: 'image',
    coverPath: path,
  };
}

function buildVideoMedia(schedule, fallbackCoverPath) {
  return {
    type: 'video',
    videoUrl: schedule.videoUrl,
    videoLabel: schedule.videoLabel || schedule.name,
    muted: schedule.muted !== false,
    aspectRatio: schedule.aspectRatio || '16:9',
    fallbackCoverPath,
  };
}

function buildScheduleMedia(station, config, schedule) {
  const fallbackCoverPath = config.defaultCover || (station === 'fm' ? '/rcfm.png' : '/rcf.png');

  if (schedule.mediaType === 'video' && schedule.videoUrl) {
    return {
      ...buildVideoMedia(schedule, fallbackCoverPath),
      coverPath: fallbackCoverPath,
      scheduleId: schedule.id,
    };
  }

  return {
    ...buildCoverMedia(station, schedule.coverPath || fallbackCoverPath),
    scheduleId: schedule.id,
  };
}

// Admin login endpoint - with rate limiting
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Get password hash from settings or environment
    const passwordHash = await getPasswordHash();

    if (!isBcryptHash(passwordHash)) {
      logger.error(
        '[Auth]',
        'Configured admin password hash is invalid. Check ADMIN_PASSWORD_HASH or server/data/admin-settings.json.'
      );
      return res.status(500).json({ error: 'Admin password is misconfigured' });
    }

    // Compare password with hash
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      logger.warn('[Auth]', `Invalid password attempt from IP: ${req.ip}`);
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token (valid for 24 hours)
    const token = jwt.sign(
      { role: 'admin' },
      getJWTSecret(),
      { expiresIn: '24h' }
    );

    logger.info('[Auth]', `Admin login successful from IP: ${req.ip}`);
    res.json({ token });
  } catch (error) {
    logger.error('[Auth]', 'Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get admin settings
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error) {
    logger.error('[Settings]', 'Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Update admin settings
router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    const newSettings = adminSettingsSchema.parse(req.body);

    if (newSettings.coverScheduling) {
      Object.keys(newSettings.coverScheduling).forEach(station => {
        const config = newSettings.coverScheduling[station];
        logger.debug('[Settings]', `${station} cover scheduling: enabled=${config.enabled}, schedules=${config.schedules?.length || 0}`);
        if (config.schedules?.length > 0) {
          config.schedules.forEach(s => {
            logger.debug('[Settings]', `    * "${s.name}" (${s.type || 'regular'}) - Days: ${s.days}, Priority: ${s.priority || 0}`);
          });
        }
      });
    }

    // Write settings to file
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(newSettings, null, 2),
      'utf8'
    );

    logger.info('[Settings]', '✅ Settings saved successfully');
    res.json({ success: true, settings: newSettings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid settings payload',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    logger.error('[Settings]', 'Error writing settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get public settings (non-sensitive settings for app use)
router.get('/public-settings', async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    // Return only public settings including weather API key (needed for client-side weather)
    res.json({
      radioStreams: settings.radioStreams,
      defaultLocation: settings.defaultLocation,
      apiBaseUrl: settings.apiBaseUrl,
      weatherProvider: settings.weatherProvider || 'openmeteo',
      coverScheduling: settings.coverScheduling || {},
      nowPlaying: settings.nowPlaying || {
        fm: { enabled: true, overrideSchedules: [] },
        folclor: { enabled: false, overrideSchedules: [] },
      }
    });
  } catch (error) {
    logger.error('[Settings]', 'Error reading public settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Get weather API key (authenticated only)
router.get('/weather-api-key', authenticateAdmin, async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    res.json({ apiKey: settings.weatherApiKey || '' });
  } catch (error) {
    logger.error('[Settings]', 'Error reading API key:', error);
    res.status(500).json({ error: 'Failed to read API key' });
  }
});

// Upload cover image for a station
router.post('/covers/:station/upload', authenticateAdmin, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { station } = req.params;
    if (!validateStationParam(station)) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    const { name, label, category } = req.body; // category: 'default' or 'scheduling'

    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    // Ensure coverScheduling exists
    if (!settings.coverScheduling) {
      settings.coverScheduling = { fm: { covers: [], schedules: [] }, folclor: { covers: [], schedules: [] } };
    }
    if (!settings.coverScheduling[station]) {
      settings.coverScheduling[station] = { covers: [], schedules: [] };
    }
    if (!settings.coverScheduling[station].covers) {
      settings.coverScheduling[station].covers = [];
    }

    // Create cover object
    const cover = {
      id: `cover-${Date.now()}`,
      name: name || req.file.originalname,
      label: label || name || req.file.originalname,
      path: `/covers/${station}/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      category: category || 'scheduling', // Default to 'scheduling' for backwards compatibility
      uploadedAt: new Date().toISOString()
    };

    // Add to covers array
    settings.coverScheduling[station].covers.push(cover);

    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

    res.json({ success: true, cover });
  } catch (error) {
    console.error('Error uploading cover:', error);
    res.status(500).json({ error: 'Failed to upload cover' });
  }
});

// Upload default/main cover for a station
router.post('/covers/:station/upload-default', authenticateAdmin, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { station } = req.params;
    if (!validateStationParam(station)) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    // Ensure coverScheduling exists
    if (!settings.coverScheduling) {
      settings.coverScheduling = { fm: { covers: [], schedules: [] }, folclor: { covers: [], schedules: [] } };
    }
    if (!settings.coverScheduling[station]) {
      settings.coverScheduling[station] = { covers: [], schedules: [] };
    }

    // Set the default cover path
    const coverPath = `/covers/${station}/${req.file.filename}`;
    settings.coverScheduling[station].defaultCover = coverPath;

    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

    res.json({
      success: true,
      coverPath,
      message: 'Default cover uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading default cover:', error);
    res.status(500).json({ error: 'Failed to upload default cover' });
  }
});

// Delete cover image
router.delete('/covers/:station/:coverId', authenticateAdmin, async (req, res) => {
  try {
    const { station, coverId } = req.params;
    if (!validateStationParam(station)) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.coverScheduling || !settings.coverScheduling[station]) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const covers = settings.coverScheduling[station].covers || [];
    const coverIndex = covers.findIndex(c => c.id === coverId);

    if (coverIndex === -1) {
      return res.status(404).json({ error: 'Cover not found' });
    }

    const cover = covers[coverIndex];

    // Delete file from disk with path validation
    const relativeCoverPath = cover.path.replace(/^\/covers\//, '');
    const filePath = path.resolve(COVERS_DIR, relativeCoverPath);

    // Validate path is within allowed directory
    if (!validateFilePath(filePath, COVERS_DIR)) {
      logger.warn('[Security]', `Path traversal attempt blocked: ${cover.path}`);
      return res.status(403).json({ error: 'Invalid file path' });
    }

    try {
      await fs.unlink(filePath);
      logger.info('[Cover]', `Deleted cover file: ${path.basename(cover.path)}`);
    } catch (error) {
      logger.warn('[Cover]', 'Could not delete file:', error);
    }

    // Remove from covers array
    covers.splice(coverIndex, 1);

    // Remove from schedules that use this cover
    if (settings.coverScheduling[station].schedules) {
      settings.coverScheduling[station].schedules = settings.coverScheduling[station].schedules.filter(
        schedule => schedule.coverPath !== cover.path
      );
    }

    if (settings.coverScheduling[station].defaultCover === cover.path) {
      settings.coverScheduling[station].defaultCover = station === 'fm' ? '/rcfm.png' : '/rcf.png';
    }

    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting cover:', error);
    res.status(500).json({ error: 'Failed to delete cover' });
  }
});

// Helper function: Evaluate current cover for a station
async function evaluateCurrentCover(station, verbose = true) {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.coverScheduling || !settings.coverScheduling[station]) {
      if (verbose) logger.debug('[Cover]', `No cover scheduling config for station: ${station}`);
      return { coverPath: station === 'fm' ? '/rcfm.png' : '/rcf.png' };
    }

    const config = settings.coverScheduling[station];

    // If not enabled, return default cover
    if (!config.enabled) {
      if (verbose) logger.debug('[Cover]', `Cover scheduling disabled for ${station}, returning default: ${config.defaultCover}`);
      return buildCoverMedia(station, config.defaultCover);
    }

    // Find active schedule based on current day/time (using Europe/Bucharest timezone)
    const now = new Date();

    // Get time in Romania timezone (Europe/Bucharest)
    const romaniaTimeStr = now.toLocaleString('en-US', {
      timeZone: 'Europe/Bucharest',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Parse Romania time components
    const romaniaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }));
    const currentDay = romaniaDate.getDay(); // 0 = Sunday
    const currentHour = romaniaDate.getHours();
    const currentMinutes = romaniaDate.getMinutes();
    const currentSeconds = romaniaDate.getSeconds();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    if (verbose) {
      logger.debug('[Cover]', `${station} - Current time: ${currentTime} (Romania/Bucharest), Day: ${currentDay} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDay]})`);
      logger.debug('[Cover]', `${station} - UTC time: ${now.getHours()}:${now.getMinutes()}`);
      logger.debug('[Cover]', `${station} - Total schedules: ${config.schedules?.length || 0}`);
    }

    const activeSchedules = (config.schedules || [])
      .filter(schedule => {
        if (verbose) {
          logger.debug('[Cover]', `Evaluating schedule: "${schedule.name}" (${schedule.type || 'regular'})`);
          logger.debug('[Cover]', `  - Days: ${schedule.days} (current: ${currentDay})`);
        }

        // Check if current day is in schedule
        if (!schedule.days.includes(currentDay)) {
          if (verbose) logger.debug('[Cover]', '  - ❌ Day not matched');
          return false;
        }

        // Handle news schedules (hour-based with duration)
        if (schedule.type === 'news') {
          if (verbose) logger.debug('[Cover]', `  - News hours: ${schedule.newsHours}, current hour: ${currentHour}`);
          // Check if current hour is in newsHours array
          if (!schedule.newsHours || !schedule.newsHours.includes(currentHour)) {
            if (verbose) logger.debug('[Cover]', '  - ❌ Hour not matched');
            return false;
          }
          // Check if current time is within duration (starts at :00)
          // Convert to seconds for accurate fractional minute support (e.g., 3.5 min = 210 sec)
          const duration = schedule.duration || 3; // Duration in minutes (can be fractional like 3.5)
          const durationInSeconds = duration * 60;
          const currentTimeInSeconds = currentMinutes * 60 + currentSeconds;
          if (schedule.endOnFirstTrack) {
            const scheduleStartMs = now.getTime() - (currentTimeInSeconds * 1000) - now.getMilliseconds();
            if (hasEndedNewsCoverWindow(station, schedule.id, scheduleStartMs)) {
              if (verbose) logger.debug('[Cover]', '  - News cover already ended for this bulletin window');
              return false;
            }

            const musicTrackStarted = hasMusicTrackAfterScheduleStart(station, scheduleStartMs);
            if (verbose) logger.debug('[Cover]', `  - End on first track enabled. Music after start? ${musicTrackStarted ? '✅' : '❌'}`);
            if (musicTrackStarted) {
              markEndedNewsCoverWindow(station, schedule.id, scheduleStartMs);
              return false;
            }
          }
          const matched = currentTimeInSeconds < durationInSeconds;
          if (verbose) logger.debug('[Cover]', `  - Time ${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} within ${duration}min (${durationInSeconds}s)? ${matched ? '✅' : '❌'}`);
          return matched;
        }

        // Handle regular schedules (time range)
        if (verbose) logger.debug('[Cover]', `  - Time range: ${schedule.startTime} - ${schedule.endTime} (current: ${currentTime})`);
        const matched = currentTime >= schedule.startTime && currentTime <= schedule.endTime;
        if (verbose) logger.debug('[Cover]', `  - ${matched ? '✅ MATCHED' : '❌ Not in range'}`);
        return matched;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority descending

    if (activeSchedules.length > 0) {
      if (verbose) logger.debug('[Cover]', `✅ Active schedule found: "${activeSchedules[0].name}"`);
      return buildScheduleMedia(station, config, activeSchedules[0]);
    }

    // No active schedule, return default
    if (verbose) logger.debug('[Cover]', `No active schedules, returning default: ${config.defaultCover}`);
    return buildCoverMedia(station, config.defaultCover);
  } catch (error) {
    logger.error('[Cover]', 'Error evaluating current cover:', error);
    return buildCoverMedia(station);
  }
}

// Get current active cover for a station (public endpoint)
router.get('/covers/current/:station', async (req, res) => {
  try {
    const { station } = req.params;
    if (!validateStationParam(station)) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    const result = await evaluateCurrentCover(station, true);
    res.json(result);
  } catch (error) {
    logger.error('[Cover]', 'Error getting current cover:', error);
    res.status(500).json({ error: 'Failed to get current cover' });
  }
});

// SSE endpoint: Stream cover updates in real-time
router.get('/covers/stream', (req, res) => {
  // Check if we've hit max clients (prevent memory issues)
  if (coverStreamClients.size >= MAX_SSE_CLIENTS) {
    logger.warn('[SSE]', `Max SSE clients (${MAX_SSE_CLIENTS}) reached, rejecting connection`);
    return res.status(503).json({ error: 'Too many active connections' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Cover stream connected' })}\n\n`);

  // Send current covers immediately
  (async () => {
    try {
      const fmCover = await evaluateCurrentCover('fm', false);
      const folclorCover = await evaluateCurrentCover('folclor', false);

      const covers = {
        fm: fmCover,
        folclor: folclorCover
      };

      res.write(`data: ${JSON.stringify({ type: 'covers', covers })}\n\n`);
      logger.info('[SSE]', `Client connected, sent initial covers:`, covers);
    } catch (error) {
      logger.error('[SSE]', 'Error sending initial covers:', error);
    }
  })();

  // Add client to tracking set
  const clientId = Date.now();
  coverStreamClients.add(res);
  logger.info('[SSE]', `Client ${clientId} connected. Total clients: ${coverStreamClients.size}`);
  startCoverChangeMonitoring();

  // Send keep-alive ping every 30 seconds
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    coverStreamClients.delete(res);
    stopCoverChangeMonitoring();
    logger.info('[SSE]', `Client ${clientId} disconnected. Total clients: ${coverStreamClients.size}`);
  });
});

// Periodic check for cover changes and broadcast to all connected clients
let coverCheckInterval = null;

export async function broadcastCurrentCovers() {
  if (coverStreamClients.size === 0) {
    return;
  }

  const fmCover = await evaluateCurrentCover('fm', false);
  const folclorCover = await evaluateCurrentCover('folclor', false);

  const currentCovers = {
    fm: fmCover,
    folclor: folclorCover
  };

  const fmChanged = JSON.stringify(lastKnownCovers.fm) !== JSON.stringify(currentCovers.fm);
  const folclorChanged = JSON.stringify(lastKnownCovers.folclor) !== JSON.stringify(currentCovers.folclor);

  if (!fmChanged && !folclorChanged) {
    return;
  }

  lastKnownCovers = currentCovers;
  const message = `data: ${JSON.stringify({ type: 'covers', covers: currentCovers })}\n\n`;

  coverStreamClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('[SSE] Error broadcasting to client:', error);
      coverStreamClients.delete(client);
    }
  });

  if (coverStreamClients.size === 0) {
    stopCoverChangeMonitoring();
  }
}

function startCoverChangeMonitoring() {
  if (coverCheckInterval || coverStreamClients.size === 0) {
    return; // Already running
  }

  console.log('[SSE] Starting cover change monitoring (every 5 seconds)');

  coverCheckInterval = setInterval(async () => {
    try {
      await broadcastCurrentCovers();
    } catch (error) {
      console.error('[SSE] Error in cover change monitoring:', error);
    }
  }, 5000); // Check every 5 seconds
}

function stopCoverChangeMonitoring() {
  if (coverCheckInterval && coverStreamClients.size === 0) {
    clearInterval(coverCheckInterval);
    coverCheckInterval = null;
  }
}

// NTP Time Synchronization Endpoints

// Test NTP server connectivity
router.post('/ntp/test', authenticateAdmin, async (req, res) => {
  const { hostname, port = 123, timeout = 5000 } = req.body;

  if (!hostname) {
    return res.status(400).json({ error: 'Hostname is required' });
  }

  try {
    const startTime = Date.now();

    // Query NTP server
    ntpClient.getNetworkTime(hostname, port, (err, date) => {
      const responseTime = Date.now() - startTime;

      if (err) {
        console.error(`NTP test failed for ${hostname}:${port}:`, err.message);
        return res.json({
          success: false,
          hostname,
          port,
          error: err.message,
          responseTime,
          message: `Failed to connect to ${hostname}:${port}`
        });
      }

      const offset = date.getTime() - Date.now();

      res.json({
        success: true,
        hostname,
        port,
        serverTime: date.toISOString(),
        localTime: new Date().toISOString(),
        offset,
        responseTime,
        message: `Successfully connected to ${hostname}:${port}`
      });
    });

  } catch (error) {
    console.error('NTP test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test NTP server'
    });
  }
});

// Sync with NTP servers and update settings
router.post('/ntp/sync', authenticateAdmin, async (req, res) => {
  const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

  try {
    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.timeSynchronization || !settings.timeSynchronization.enabled) {
      return res.json({
        success: false,
        message: 'NTP synchronization is disabled'
      });
    }

    // Get enabled NTP servers sorted by priority
    const enabledServers = settings.timeSynchronization.ntpServers
      .filter(server => server.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (enabledServers.length === 0) {
      return res.json({
        success: false,
        message: 'No enabled NTP servers configured'
      });
    }

    // Try to sync with servers in priority order
    let syncSuccess = false;
    let syncedServer = null;
    let lastError = null;

    for (const server of enabledServers) {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 5000);

          ntpClient.getNetworkTime(server.hostname, server.port, (err, date) => {
            clearTimeout(timeout);

            if (err) {
              reject(err);
            } else {
              syncSuccess = true;
              syncedServer = server;
              resolve(date);
            }
          });
        });

        if (syncSuccess) {
          console.log(`Successfully synced with ${server.hostname}:${server.port}`);
          break;
        }
      } catch (error) {
        console.error(`Failed to sync with ${server.hostname}:${server.port}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // Update settings with sync status
    if (syncSuccess) {
      settings.timeSynchronization.syncStatus = 'synced';
      settings.timeSynchronization.lastSync = new Date().toISOString();
    } else {
      settings.timeSynchronization.syncStatus = 'error';
    }

    // Save updated settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));

    if (syncSuccess) {
      res.json({
        success: true,
        syncStatus: 'synced',
        lastSync: settings.timeSynchronization.lastSync,
        server: `${syncedServer.hostname}:${syncedServer.port}`,
        message: `Successfully synchronized with ${syncedServer.hostname}`
      });
    } else {
      res.json({
        success: false,
        syncStatus: 'error',
        message: `Failed to sync with any NTP server. Last error: ${lastError?.message || 'Unknown error'}`,
        error: lastError?.message
      });
    }

  } catch (error) {
    console.error('NTP sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to perform NTP sync'
    });
  }
});

export default router;
