import cron from 'node-cron';
import { aggregateDailyStats, cleanupStaleSessions } from '../database/analytics.js';

// Run daily aggregation at midnight (Europe/Bucharest time)
export function startAnalyticsCronJobs() {
  console.log('[Analytics] Starting cron jobs...');

  // Aggregate yesterday's data at 00:05 every day
  cron.schedule('5 0 * * *', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    console.log(`[Analytics] Running daily aggregation for ${dateStr}...`);
    aggregateDailyStats(dateStr);
  }, {
    timezone: 'Europe/Bucharest'
  });

  // Clean up stale sessions every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    cleanupStaleSessions();
  });

  console.log('[Analytics] Cron jobs started:');
  console.log('  - Daily aggregation: 00:05 Europe/Bucharest');
  console.log('  - Stale session cleanup: Every 5 minutes');
}

export default { startAnalyticsCronJobs };
