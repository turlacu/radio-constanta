import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithTimeout } from '../utils/fetchWithTimeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');
const OPEN_WEATHER_MAP_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

async function getWeatherSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);

    return {
      provider: settings.weatherProvider || 'openmeteo',
      apiKey: settings.weatherApiKey || '',
      defaultLocation: settings.defaultLocation || null,
    };
  } catch {
    return {
      provider: 'openmeteo',
      apiKey: '',
      defaultLocation: null,
    };
  }
}

function getValidatedCoordinate(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

router.get('/current', async (req, res) => {
  try {
    const settings = await getWeatherSettings();
    const fallbackLat = settings.defaultLocation?.lat ?? 44.1598;
    const fallbackLon = settings.defaultLocation?.lon ?? 28.6348;
    const lat = getValidatedCoordinate(req.query.lat, fallbackLat);
    const lon = getValidatedCoordinate(req.query.lon, fallbackLon);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    let upstreamUrl;

    if (settings.provider === 'openweathermap') {
      if (!settings.apiKey) {
        return res.status(503).json({ error: 'Weather provider is not configured' });
      }

      upstreamUrl = `${OPEN_WEATHER_MAP_URL}?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(settings.apiKey)}&units=metric`;
    } else {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover',
        daily: 'sunrise,sunset',
        timezone: 'auto',
        forecast_days: '1',
      });
      upstreamUrl = `${OPEN_METEO_URL}?${params.toString()}`;
    }

    const response = await fetchWithTimeout(upstreamUrl, {
      headers: {
        'User-Agent': 'Radio Constanta Weather Proxy/1.0',
      },
    }, 8000);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch weather data',
        provider: settings.provider,
      });
    }

    const payload = await response.json();
    res.set('Cache-Control', 'public, max-age=300');
    res.json(payload);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message,
    });
  }
});

export default router;
