import {
  formatDuration as dateFnsFormatDuration,
  intervalToDuration,
  isSameDay,
} from 'date-fns';
import type { createFormatter } from 'next-intl';
import { dateOptions, dateTimeOptions, timeOptions } from './date-time-options';

export const formats = (formatter: ReturnType<typeof createFormatter>) => {
  const formatDate = (date: Date) => formatter.dateTime(date, dateOptions);
  const formatDateTime = (date: Date) =>
    formatter.dateTime(date, dateTimeOptions);
  const formatTime = (date: Date) => formatter.dateTime(date, timeOptions);

  const formatRange = (
    from: string | Date,
    to?: string | Date | null,
    noEndDateLabel = 'open',
  ) => {
    const fromDate = new Date(from);

    if (to) {
      const toDate = new Date(to);

      if (isSameDay(to, from)) {
        return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatTime(toDate)}`;
      }

      return `${formatDateTime(fromDate)} - ${formatDateTime(toDate)}`;
    } else {
      return `${formatDateTime(fromDate)} - ${noEndDateLabel}`;
    }
  };

  const formatDuration = (from: Date | string, to?: Date | string | null) => {
    const start = new Date(from);
    const end = to ? new Date(to) : new Date();

    const duration = intervalToDuration({ start, end });
    return dateFnsFormatDuration(duration, {
      zero: false,
      format: ['days', 'hours', 'minutes'],
    });
  };

  const formatDurationByMinutes = (minutes: number): string => {
    const duration = intervalToDuration({ start: 0, end: minutes * 60 * 1000 });

    return dateFnsFormatDuration(duration, {
      zero: false,
      format: ['days', 'hours', 'minutes'],
    });
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRange,
    formatDuration,
    formatDurationByMinutes,
  };
};
