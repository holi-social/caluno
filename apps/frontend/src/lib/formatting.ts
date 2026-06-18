import {
  formatDuration as dateFnsFormatDuration,
  intervalToDuration,
} from 'date-fns';
import {
  dateOptions,
  dateTimeOptions,
  timeOptions,
} from '@/lib/date-time-options';

// For active-locale formatting prefer:
// - Client components: useFormatting() from '@/hooks/use-formatting'
// - Server components: getFormatting() from '@/lib/formatting-server'
//
// These sync helpers remain as an explicit-locale fallback while call sites are
// gradually migrated. Callers that rely on the default locale will render in
// English (`en`) until they switch to the active-locale helpers above.
export const DEFAULT_LOCALE = 'en';

export const formatDateTime = (date: Date, locale = DEFAULT_LOCALE) =>
  date.toLocaleDateString(locale, dateTimeOptions);

export const formatDate = (date: Date, locale = DEFAULT_LOCALE) =>
  date.toLocaleDateString(locale, dateOptions);

export const formatTime = (date: Date, locale = DEFAULT_LOCALE) =>
  date.toLocaleTimeString(locale, timeOptions);

export const formatRange = (from: string | Date, to: string | Date) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const isSameDay =
    fromDate.getDate() === toDate.getDate() &&
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getFullYear() === toDate.getFullYear();

  if (isSameDay) {
    return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatTime(toDate)}`;
  }

  return `${formatDateTime(fromDate)} - ${formatDateTime(toDate)}`;
};

export const formatDuration = (start: Date, end: Date) => {
  const duration = intervalToDuration({ start, end });
  return dateFnsFormatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
  });
};
