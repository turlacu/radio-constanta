/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */

import logger from './logger.js';

/**
 * Validate environment variables on server startup
 * Exits process if critical variables are missing or invalid
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!validEnvs.includes(nodeEnv)) {
    warnings.push(`NODE_ENV="${nodeEnv}" is not standard. Use: ${validEnvs.join(', ')}`);
  }

  // Check PORT
  const port = process.env.PORT || '3001';
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1000 || portNum > 65535) {
    errors.push(`PORT must be a number between 1000 and 65535, got: ${port}`);
  }

  // Check JWT_SECRET in production
  if (nodeEnv === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      errors.push('JWT_SECRET is required in production');
    } else if (jwtSecret === 'your-secret-key-change-in-production') {
      errors.push('JWT_SECRET cannot use default value in production. Generate a secure secret.');
    } else if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
  }

  // Check ADMIN_PASSWORD_HASH in production
  if (nodeEnv === 'production') {
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (passwordHash && !passwordHash.startsWith('$2b$') && !passwordHash.startsWith('$2a$')) {
      warnings.push('ADMIN_PASSWORD_HASH does not appear to be a bcrypt hash');
    }
  }

  // Check ALLOWED_ORIGINS for CORS
  if (nodeEnv === 'production' && !process.env.ALLOWED_ORIGINS) {
    warnings.push('ALLOWED_ORIGINS not set. CORS will allow all origins (security risk).');
  }

  // Check LOG_LEVEL
  if (process.env.LOG_LEVEL) {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(process.env.LOG_LEVEL)) {
      warnings.push(`LOG_LEVEL="${process.env.LOG_LEVEL}" is invalid. Use: ${validLevels.join(', ')}`);
    }
  }

  // Report results
  if (errors.length > 0) {
    logger.error('[Env Validation]', 'Environment validation failed:');
    errors.forEach(err => logger.error('[Env Validation]', `  ✗ ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    logger.warn('[Env Validation]', 'Environment validation warnings:');
    warnings.forEach(warn => logger.warn('[Env Validation]', `  ⚠ ${warn}`));
  }

  logger.info('[Env Validation]', '✓ Environment validation passed');

  // Return validated config
  return {
    nodeEnv,
    port: portNum,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || null,
    logLevel: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
  };
}

export default validateEnvironment;
