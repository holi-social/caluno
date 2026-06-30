import { isSameDay } from 'date-fns';
import { useFormatter } from 'next-intl';
import {
  dateOptions,
  dateTimeOptions,
  timeOptions,
} from '@/lib/date-time-options';

export function useFormatting() {
  const formatter = useFormatter();

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

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRange,
  };
}
