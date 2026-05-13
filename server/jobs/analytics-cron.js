import cron from 'node-cron';
import { aggregateDailyStats, cleanupStaleSessions } from '../database/analytics.js';
import { BUCHAREST_TIMEZONE, addDaysToDateString, formatDateInTimeZone } from '../utils/time.js';
import logger from '../utils/logger.js';

// Run daily aggregation at midnight (Europe/Bucharest time)
export function startAnalyticsCronJobs() {
  logger.info('[Analytics] Starting cron jobs...');

  // Aggregate yesterday's data at 00:05 every day
  cron.schedule('5 0 * * *', () => {
    const dateStr = addDaysToDateString(formatDateInTimeZone(new Date(), BUCHAREST_TIMEZONE), -1);

    logger.info(`[Analytics] Running daily aggregation for ${dateStr}...`);
    aggregateDailyStats(dateStr);
  }, {
    timezone: BUCHAREST_TIMEZONE
  });

  // Clean up stale sessions every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    cleanupStaleSessions();
  });

  logger.info('[Analytics] Cron jobs started:');
  logger.info('  - Daily aggregation: 00:05 Europe/Bucharest');
  logger.info('  - Stale session cleanup: Every 5 minutes');
}

export default { startAnalyticsCronJobs };
