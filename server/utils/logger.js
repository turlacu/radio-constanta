/**
 * Logger utility - centralized logging with environment-based levels
 * Replaces scattered console.log statements throughout the codebase
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  debug: '\x1b[90m', // Gray
  reset: '\x1b[0m',
};

class Logger {
  constructor() {
    // Set log level based on environment
    const envLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.level = LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
    this.useColors = process.env.NODE_ENV !== 'production';
  }

  _log(level, prefix, ...args) {
    if (LOG_LEVELS[level] <= this.level) {
      const timestamp = new Date().toISOString();
      const color = this.useColors ? COLORS[level] : '';
      const reset = this.useColors ? COLORS.reset : '';
      const levelStr = level.toUpperCase().padEnd(5);

      console[level === 'debug' ? 'log' : level](
        `${color}[${timestamp}] ${levelStr} ${prefix}${reset}`,
        ...args
      );
    }
  }

  error(prefix, ...args) {
    this._log('error', prefix, ...args);
  }

  warn(prefix, ...args) {
    this._log('warn', prefix, ...args);
  }

  info(prefix, ...args) {
    this._log('info', prefix, ...args);
  }

  debug(prefix, ...args) {
    this._log('debug', prefix, ...args);
  }

  // Convenience methods for common modules
  analytics(level, ...args) {
    this[level]('[Analytics]', ...args);
  }

  sse(level, ...args) {
    this[level]('[SSE]', ...args);
  }

  api(level, ...args) {
    this[level]('[API]', ...args);
  }

  db(level, ...args) {
    this[level]('[Database]', ...args);
  }

  auth(level, ...args) {
    this[level]('[Auth]', ...args);
  }

  cover(level, ...args) {
    this[level]('[Cover]', ...args);
  }

  settings(level, ...args) {
    this[level]('[Settings]', ...args);
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
