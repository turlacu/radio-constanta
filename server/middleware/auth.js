import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Validate JWT secret is not using default value in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-secret-key-change-in-production') {
  logger.error('[Security]', 'CRITICAL: Using default JWT_SECRET in production! Set JWT_SECRET environment variable.');
  process.exit(1);
}

/**
 * Middleware to verify JWT token for admin endpoints
 * Extracts token from Authorization header and verifies it
 */
export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('[Auth]', `Unauthorized access attempt to ${req.path} - No token provided`);
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    logger.debug('[Auth]', `Admin authenticated for ${req.path}`);
    next();
  } catch (error) {
    logger.warn('[Auth]', `Invalid token for ${req.path}:`, error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Get JWT secret (for use in other modules)
 */
export const getJWTSecret = () => JWT_SECRET;

export default { authenticateAdmin, getJWTSecret };
