import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import newsRouter from './routes/news.js';
import articleRouter from './routes/article.js';
import streamRouter from './routes/stream.js';
import imageProxyRouter from './routes/imageProxy.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/news', newsRouter);
app.use('/api/article', articleRouter);
app.use('/api/stream', streamRouter);
app.use('/api/image-proxy', imageProxyRouter);
app.use('/api/admin', adminRouter);

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
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
