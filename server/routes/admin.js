import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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
      weatherApiKey: settings.weatherApiKey || ''
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

export default router;
