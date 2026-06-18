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

  const formatRange = (from: string | Date, to: string | Date) => {
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

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRange,
  };
}
