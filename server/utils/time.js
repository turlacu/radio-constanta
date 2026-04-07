const BUCHAREST_TIMEZONE = 'Europe/Bucharest';

function getFormatter(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
}

export function getTimeZoneParts(date, timeZone = BUCHAREST_TIMEZONE) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function formatDateInTimeZone(date, timeZone = BUCHAREST_TIMEZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeZoneOffsetMs(date, timeZone = BUCHAREST_TIMEZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const utcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcTimestamp - date.getTime();
}

export function getUtcTimestampForTimeInZone(dateString, timeString = '00:00:00', timeZone = BUCHAREST_TIMEZONE) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute, second] = timeString.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return utcGuess - offset;
}

export function addDaysToDateString(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export function getDayRangeInTimeZone(dateString, timeZone = BUCHAREST_TIMEZONE) {
  return {
    start: getUtcTimestampForTimeInZone(dateString, '00:00:00', timeZone),
    end: getUtcTimestampForTimeInZone(addDaysToDateString(dateString, 1), '00:00:00', timeZone),
  };
}

export { BUCHAREST_TIMEZONE };
