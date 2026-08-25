import { tz } from '@date-fns/tz';
import {
  format as dateFnsFormat,
  formatDuration as dateFnsFormatDuration,
  intervalToDuration,
  isSameDay,
  type Locale,
} from 'date-fns';
import { de, enGB } from 'date-fns/locale';

export const DEFAULT_TIMEZONE = 'Europe/Berlin';

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const supportedLocales: Record<string, Locale> = {
  en: enGB,
  de,
};

const getLocale = (locale: string): Locale =>
  supportedLocales[locale.toLocaleLowerCase()] ?? de;

export const formats = (locale: string) => {
  const format = (date: Date, formatting: string) =>
    dateFnsFormat(date, formatting, {
      locale: getLocale(locale),
      in: tz(DEFAULT_TIMEZONE),
    });

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    if (options) {
      return new Intl.DateTimeFormat(locale, {
        timeZone: DEFAULT_TIMEZONE,
        ...options,
      }).format(date);
    }
    return format(date, 'P');
  };
  const formatDateTime = (date: Date) => format(date, 'Pp');
  const formatTime = (date: Date) => format(date, 'p');

  const formatRange = (
    from: string | Date,
    to?: string | Date | null,
    noEndDateLabel = 'open',
    fromFormat = 'Pp',
    toFormat = 'Pp',
  ) => {
    const fromDate = new Date(from);

    if (to) {
      const toDate = new Date(to);

      if (isSameDay(to, from, { in: tz(DEFAULT_TIMEZONE) })) {
        return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatTime(toDate)}`;
      }

      return `${format(fromDate, fromFormat)} - ${format(toDate, toFormat)}`;
    } else {
      return `${format(fromDate, fromFormat)} - ${noEndDateLabel}`;
    }
  };

  const formatDateRange = (from: string | Date, to: string | Date) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    return new Intl.DateTimeFormat(locale, {
      timeZone: DEFAULT_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatRange(fromDate, toDate);
  };

  const formatTimeRange = (from: string | Date, to: string | Date) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    return `${formatTime(fromDate)} - ${formatTime(toDate)}`;
  };

  const formatDuration = (from: Date | string, to?: Date | string | null) => {
    const start = new Date(from);
    const end = to ? new Date(to) : new Date();

    const duration = intervalToDuration(
      { start, end },
      { in: tz(DEFAULT_TIMEZONE) },
    );

    return dateFnsFormatDuration(duration, {
      zero: false,
      format: ['days', 'hours', 'minutes'],
      locale: getLocale(locale),
    });
  };

  const formatDurationByMinutes = (minutes: number): string => {
    const duration = intervalToDuration(
      { start: 0, end: minutes * 60 * 1000 },
      { in: tz(DEFAULT_TIMEZONE) },
    );

    return dateFnsFormatDuration(duration, {
      zero: false,
      format: ['days', 'hours', 'minutes'],
      locale: getLocale(locale),
    });
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRange,
    formatDateRange,
    formatTimeRange,
    formatDuration,
    formatDurationByMinutes,
  };
};
