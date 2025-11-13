import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for cover uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const station = req.params.station || 'fm';
    const uploadPath = path.join(__dirname, '../../public/covers', station);

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

// Admin password from environment variable
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$K2wPm5W9ZMUoWo8HPVCnMORGDjANxJNcKUK4v5FMb8q2TvjM5rIom'; // default: "admin123"
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

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

    // Compare password with hash
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

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

    // Write settings to file
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(newSettings, null, 2),
      'utf8'
    );

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
    const { name, label } = req.body;

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

// Get current active cover for a station (public endpoint)
router.get('/covers/current/:station', async (req, res) => {
  try {
    const { station } = req.params;
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.coverScheduling || !settings.coverScheduling[station]) {
      return res.json({ coverPath: station === 'fm' ? '/rcfm.png' : '/rcf.png' });
    }

    const config = settings.coverScheduling[station];

    // If not enabled, return default cover
    if (!config.enabled) {
      return res.json({ coverPath: config.defaultCover || (station === 'fm' ? '/rcfm.png' : '/rcf.png') });
    }

    // Find active schedule based on current day/time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    const activeSchedules = (config.schedules || [])
      .filter(schedule => {
        // Check if current day is in schedule
        if (!schedule.days.includes(currentDay)) {
          return false;
        }

        // Handle news schedules (hour-based with duration)
        if (schedule.type === 'news') {
          // Check if current hour is in newsHours array
          if (!schedule.newsHours || !schedule.newsHours.includes(currentHour)) {
            return false;
          }
          // Check if current minutes are within duration (starts at :00)
          const duration = schedule.duration || 3; // Default 3 minutes
          return currentMinutes >= 0 && currentMinutes < duration;
        }

        // Handle regular schedules (time range)
        return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority descending

    if (activeSchedules.length > 0) {
      return res.json({
        coverPath: activeSchedules[0].coverPath,
        scheduleId: activeSchedules[0].id
      });
    }

    // No active schedule, return default
    res.json({ coverPath: config.defaultCover || (station === 'fm' ? '/rcfm.png' : '/rcf.png') });
  } catch (error) {
    console.error('Error getting current cover:', error);
    res.status(500).json({ error: 'Failed to get current cover' });
  }
});

export default router;
