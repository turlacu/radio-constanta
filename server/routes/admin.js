import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import ntpClient from 'ntp-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for cover uploads
// Store in server/data/covers for persistence across deployments
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const station = req.params.station || 'fm';
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
    const uniqueName = `${Date.now()}-${file.originalname}`;
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

// Admin password from environment variable (fallback)
const DEFAULT_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$K2wPm5W9ZMUoWo8HPVCnMORGDjANxJNcKUK4v5FMb8q2TvjM5rIom'; // default: "admin123"
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

// Get admin password hash (from settings file or environment variable)
async function getPasswordHash() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    // Check if password hash exists in settings file
    if (settings.security && settings.security.passwordHash) {
      return settings.security.passwordHash;
    }
  } catch (error) {
    // Settings file doesn't exist or doesn't have password - use env var
  }

  // Fallback to environment variable
  return DEFAULT_PASSWORD_HASH;
}

// SSE: Track connected clients for cover updates
const coverStreamClients = new Set();
let lastKnownCovers = { fm: null, folclor: null };

// Middleware to verify JWT token
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Get password hash from settings or environment
    const passwordHash = await getPasswordHash();

    // Compare password with hash
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token (valid for 24 hours)
    const token = jwt.sign(
      { role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change admin password endpoint
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Get current password hash
    const currentPasswordHash = await getPasswordHash();

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, currentPasswordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Read current settings
    let settings = {};
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf8');
      settings = JSON.parse(data);
    } catch (error) {
      // Settings file doesn't exist, create new structure
      settings = {};
    }

    // Update password hash in settings
    if (!settings.security) {
      settings.security = {};
    }
    settings.security.passwordHash = newPasswordHash;

    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

    console.log('[Security] Admin password changed successfully');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get admin settings
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Update admin settings
router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    const newSettings = req.body;

    // Validate settings structure
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    // Log cover scheduling updates
    if (newSettings.coverScheduling) {
      Object.keys(newSettings.coverScheduling).forEach(station => {
        const config = newSettings.coverScheduling[station];
        console.log(`[Settings API] ${station} cover scheduling:`);
        console.log(`[Settings API]   - Enabled: ${config.enabled}`);
        console.log(`[Settings API]   - Schedules: ${config.schedules?.length || 0}`);
        if (config.schedules?.length > 0) {
          config.schedules.forEach(s => {
            console.log(`[Settings API]     * "${s.name}" (${s.type || 'regular'}) - Days: ${s.days}, Priority: ${s.priority || 0}`);
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

    console.log('[Settings API] ✅ Settings saved successfully');
    res.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error('Error writing settings:', error);
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
      weatherApiKey: settings.weatherApiKey || '',
      coverScheduling: settings.coverScheduling || {}
    });
  } catch (error) {
    console.error('Error reading public settings:', error);
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
    console.error('Error reading API key:', error);
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

    // Delete file from disk
    const filePath = path.join(__dirname, '../../public', cover.path);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Could not delete file:', error);
    }

    // Remove from covers array
    covers.splice(coverIndex, 1);

    // Remove from schedules that use this cover
    if (settings.coverScheduling[station].schedules) {
      settings.coverScheduling[station].schedules = settings.coverScheduling[station].schedules.filter(
        schedule => schedule.coverPath !== cover.path
      );
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
      if (verbose) console.log(`[Cover API] No cover scheduling config for station: ${station}`);
      return { coverPath: station === 'fm' ? '/rcfm.png' : '/rcf.png' };
    }

    const config = settings.coverScheduling[station];

    // If not enabled, return default cover
    if (!config.enabled) {
      if (verbose) console.log(`[Cover API] Cover scheduling disabled for ${station}, returning default: ${config.defaultCover}`);
      return { coverPath: config.defaultCover || (station === 'fm' ? '/rcfm.png' : '/rcf.png') };
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
      console.log(`[Cover API] ${station} - Current time: ${currentTime} (Romania/Bucharest), Day: ${currentDay} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDay]})`);
      console.log(`[Cover API] ${station} - UTC time: ${now.getHours()}:${now.getMinutes()}`);
      console.log(`[Cover API] ${station} - Total schedules: ${config.schedules?.length || 0}`);
    }

    const activeSchedules = (config.schedules || [])
      .filter(schedule => {
        if (verbose) {
          console.log(`[Cover API] Evaluating schedule: "${schedule.name}" (${schedule.type || 'regular'})`);
          console.log(`[Cover API]   - Days: ${schedule.days} (current: ${currentDay})`);
        }

        // Check if current day is in schedule
        if (!schedule.days.includes(currentDay)) {
          if (verbose) console.log(`[Cover API]   - ❌ Day not matched`);
          return false;
        }

        // Handle news schedules (hour-based with duration)
        if (schedule.type === 'news') {
          if (verbose) console.log(`[Cover API]   - News hours: ${schedule.newsHours}, current hour: ${currentHour}`);
          // Check if current hour is in newsHours array
          if (!schedule.newsHours || !schedule.newsHours.includes(currentHour)) {
            if (verbose) console.log(`[Cover API]   - ❌ Hour not matched`);
            return false;
          }
          // Check if current time is within duration (starts at :00)
          // Convert to seconds for accurate fractional minute support (e.g., 3.5 min = 210 sec)
          const duration = schedule.duration || 3; // Duration in minutes (can be fractional like 3.5)
          const durationInSeconds = duration * 60;
          const currentTimeInSeconds = currentMinutes * 60 + currentSeconds;
          const matched = currentTimeInSeconds < durationInSeconds;
          if (verbose) console.log(`[Cover API]   - Time ${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} within ${duration}min (${durationInSeconds}s)? ${matched ? '✅' : '❌'}`);
          return matched;
        }

        // Handle regular schedules (time range)
        if (verbose) console.log(`[Cover API]   - Time range: ${schedule.startTime} - ${schedule.endTime} (current: ${currentTime})`);
        const matched = currentTime >= schedule.startTime && currentTime <= schedule.endTime;
        if (verbose) console.log(`[Cover API]   - ${matched ? '✅ MATCHED' : '❌ Not in range'}`);
        return matched;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority descending

    if (activeSchedules.length > 0) {
      if (verbose) console.log(`[Cover API] ✅ Active schedule found: "${activeSchedules[0].name}" -> ${activeSchedules[0].coverPath}`);
      return {
        coverPath: activeSchedules[0].coverPath,
        scheduleId: activeSchedules[0].id
      };
    }

    // No active schedule, return default
    if (verbose) console.log(`[Cover API] No active schedules, returning default: ${config.defaultCover}`);
    return { coverPath: config.defaultCover || (station === 'fm' ? '/rcfm.png' : '/rcf.png') };
  } catch (error) {
    console.error('Error evaluating current cover:', error);
    return { coverPath: station === 'fm' ? '/rcfm.png' : '/rcf.png' };
  }
}

// Get current active cover for a station (public endpoint)
router.get('/covers/current/:station', async (req, res) => {
  try {
    const { station } = req.params;
    const result = await evaluateCurrentCover(station, true);
    res.json(result);
  } catch (error) {
    console.error('Error getting current cover:', error);
    res.status(500).json({ error: 'Failed to get current cover' });
  }
});

// SSE endpoint: Stream cover updates in real-time
router.get('/covers/stream', (req, res) => {
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
        fm: fmCover.coverPath,
        folclor: folclorCover.coverPath
      };

      res.write(`data: ${JSON.stringify({ type: 'covers', covers })}\n\n`);
      console.log('[SSE] Client connected, sent initial covers:', covers);
    } catch (error) {
      console.error('[SSE] Error sending initial covers:', error);
    }
  })();

  // Add client to tracking set
  const clientId = Date.now();
  coverStreamClients.add(res);
  console.log(`[SSE] Client ${clientId} connected. Total clients: ${coverStreamClients.size}`);

  // Send keep-alive ping every 30 seconds
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    coverStreamClients.delete(res);
    console.log(`[SSE] Client ${clientId} disconnected. Total clients: ${coverStreamClients.size}`);
  });
});

// Periodic check for cover changes and broadcast to all connected clients
let coverCheckInterval = null;

function startCoverChangeMonitoring() {
  if (coverCheckInterval) {
    return; // Already running
  }

  console.log('[SSE] Starting cover change monitoring (every 5 seconds)');

  coverCheckInterval = setInterval(async () => {
    try {
      // Evaluate current covers for both stations
      const fmCover = await evaluateCurrentCover('fm', false);
      const folclorCover = await evaluateCurrentCover('folclor', false);

      const currentCovers = {
        fm: fmCover.coverPath,
        folclor: folclorCover.coverPath
      };

      // Check if covers have changed
      const fmChanged = lastKnownCovers.fm !== currentCovers.fm;
      const folclorChanged = lastKnownCovers.folclor !== currentCovers.folclor;

      if (fmChanged || folclorChanged) {
        console.log('[SSE] Cover change detected!');
        if (fmChanged) console.log(`[SSE]   FM: ${lastKnownCovers.fm} → ${currentCovers.fm}`);
        if (folclorChanged) console.log(`[SSE]   Folclor: ${lastKnownCovers.folclor} → ${currentCovers.folclor}`);

        // Update last known covers
        lastKnownCovers = currentCovers;

        // Broadcast to all connected clients
        const message = `data: ${JSON.stringify({ type: 'covers', covers: currentCovers })}\n\n`;
        let broadcastCount = 0;

        coverStreamClients.forEach(client => {
          try {
            client.write(message);
            broadcastCount++;
          } catch (error) {
            console.error('[SSE] Error broadcasting to client:', error);
            coverStreamClients.delete(client);
          }
        });

        console.log(`[SSE] Broadcasted update to ${broadcastCount} client(s)`);
      }
    } catch (error) {
      console.error('[SSE] Error in cover change monitoring:', error);
    }
  }, 5000); // Check every 5 seconds
}

// Start monitoring when module loads
startCoverChangeMonitoring();

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
