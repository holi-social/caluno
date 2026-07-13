// "Today" boundaries must be computed in the app's display timezone
// (Europe/Berlin), not UTC — otherwise the includePast=false cutoff is off by
// the Berlin offset near midnight and drops/keeps the wrong shifts. The backend
// has no date-fns/tz, so this uses Intl (consistent with i18n/format-date-time).
const APP_TIME_ZONE = 'Europe/Berlin';

function partsToNumber(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(parts.find((part) => part.type === type)?.value);
}

/** The app-timezone offset (ms ahead of UTC) at the given instant. */
function timeZoneOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const asUtc = Date.UTC(
    partsToNumber(parts, 'year'),
    partsToNumber(parts, 'month') - 1,
    partsToNumber(parts, 'day'),
    partsToNumber(parts, 'hour'),
    partsToNumber(parts, 'minute'),
    partsToNumber(parts, 'second'),
  );
  return asUtc - date.getTime();
}

/** Start of the current day in the app timezone, returned as a UTC instant. */
export function startOfTodayInAppTimeZone(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const utcMidnight = Date.UTC(
    partsToNumber(parts, 'year'),
    partsToNumber(parts, 'month') - 1,
    partsToNumber(parts, 'day'),
  );
  // Midnight is never a DST transition point in Berlin, so the offset at the
  // naive UTC-midnight instant equals the offset at local midnight.
  return new Date(utcMidnight - timeZoneOffsetMs(new Date(utcMidnight)));
}
