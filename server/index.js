import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, copyFile, access } from 'fs/promises';
import newsRouter from './routes/news.js';
import articleRouter from './routes/article.js';
import imageProxyRouter from './routes/imageProxy.js';
import adminRouter, { broadcastCurrentCovers } from './routes/admin.js';
import analyticsRouter from './routes/analytics.js';
import weatherRouter from './routes/weather.js';
import nowPlayingRouter, { getNowPlayingState, setNowPlayingBroadcaster, setNowPlayingUpdateHandler } from './routes/nowplaying.js';
import { initializeDatabase as initAnalyticsDB } from './database/analytics.js';
import { startAnalyticsCronJobs } from './jobs/analytics-cron.js';
import logger from './utils/logger.js';
import { validateEnvironment } from './utils/validateEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables before starting server
const config = validateEnvironment();

const app = express();
const PORT = config.port;

// Coolify and similar platforms run the app behind a reverse proxy.
// Trust the first proxy so req.ip and rate limiting work correctly.
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// Initialize persistent data directories on startup
const initializeDataDirectories = async () => {
  const dataDir = path.join(__dirname, 'data');
  const coversDir = path.join(dataDir, 'covers');
  const fmCoversDir = path.join(coversDir, 'fm');
  const folclorCoversDir = path.join(coversDir, 'folclor');

  try {
    await mkdir(dataDir, { recursive: true });
    await mkdir(coversDir, { recursive: true });
    await mkdir(fmCoversDir, { recursive: true });
    await mkdir(folclorCoversDir, { recursive: true });
    logger.info('[Server]', '✓ Persistent data directories initialized');
  } catch (error) {
    logger.error('[Server]', 'Error creating data directories:', error);
  }
};

// Initialize settings file from template if it doesn't exist
const initializeSettingsFile = async () => {
  const dataDir = path.join(__dirname, 'data');
  const settingsFile = path.join(dataDir, 'admin-settings.json');
  const templateFile = path.join(__dirname, 'admin-settings.template.json'); // Template is in server/, not server/data/

  try {
    // Check if settings file exists
    await access(settingsFile);
    logger.info('[Server]', '✓ Admin settings file exists');
  } catch (error) {
    // Settings file doesn't exist, copy from template
    try {
      await copyFile(templateFile, settingsFile);
      logger.info('[Server]', '✓ Admin settings file created from template');
    } catch (copyError) {
      logger.error('[Server]', 'Error creating settings file from template:', copyError);
      logger.error('[Server]', 'Make sure admin-settings.template.json exists in server/');
    }
  }
};

// Initialize directories and settings before starting server
await initializeDataDirectories();
await initializeSettingsFile();
await initAnalyticsDB();

// Middleware
// CORS configuration - restrict origins in production
const corsOptions = {
  origin: config.allowedOrigins || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

if (config.nodeEnv === 'production' && !config.allowedOrigins) {
  logger.warn('[Security]', 'CORS configured to allow all origins. Set ALLOWED_ORIGINS in production!');
}

app.use(cors(corsOptions));
app.use(express.text({ type: 'text/plain' }));
app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  next(err);
});

// Request logging middleware
app.use((req, res, next) => {
  logger.debug('[HTTP]', `${req.method} ${req.path}`);
  next();
});

// Serve uploaded cover images from persistent storage
app.use('/covers', express.static(path.join(__dirname, 'data/covers')));

// API Routes
app.use('/api/news', newsRouter);
app.use('/api/article', articleRouter);
app.use('/api/image-proxy', imageProxyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/nowplaying', nowPlayingRouter);

// Health check endpoint (lightweight, no logging)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  // 404 handler for unmatched API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path
    });
  });

  // Handle React routing, return all requests to React app (except /api/*)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  void next;
  logger.error('[Server]', `Error on ${req.method} ${req.path}:`, err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'production' ? 'An error occurred' : err.message,
  });
});

const server = createServer(app);
const nowPlayingWss = new WebSocketServer({ noServer: true });

function sendNowPlayingMessage(client, message) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

nowPlayingWss.on('connection', (ws) => {
  logger.debug('[NowPlaying]', 'WebSocket client connected');
  sendNowPlayingMessage(ws, {
    type: 'nowplaying:snapshot',
    data: getNowPlayingState(),
  });

  ws.on('close', () => {
    logger.debug('[NowPlaying]', 'WebSocket client disconnected');
  });
});

setNowPlayingBroadcaster((message) => {
  nowPlayingWss.clients.forEach((client) => {
    sendNowPlayingMessage(client, message);
  });
});

setNowPlayingUpdateHandler(() => {
  broadcastCurrentCovers().catch((error) => {
    logger.error('[NowPlaying]', 'Error refreshing covers after now playing update:', error);
  });
});

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (pathname !== '/api/nowplaying/ws') {
    socket.destroy();
    return;
  }

  nowPlayingWss.handleUpgrade(request, socket, head, (ws) => {
    nowPlayingWss.emit('connection', ws, request);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  logger.info('[Server]', `🚀 Server running on port ${PORT}`);
  logger.info('[Server]', `📍 Environment: ${config.nodeEnv}`);
  logger.info('[Server]', `📊 Log level: ${config.logLevel}`);

  // Start analytics cron jobs
  startAnalyticsCronJobs();
});
