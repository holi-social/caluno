import { getFormatter } from 'next-intl/server';
import {
  dateOptions,
  dateTimeOptions,
  timeOptions,
} from '@/lib/date-time-options';

const isSameDay = (from: Date, to: Date) =>
  from.getDate() === to.getDate() &&
  from.getMonth() === to.getMonth() &&
  from.getFullYear() === to.getFullYear();

export async function getFormatting() {
  const formatter = await getFormatter();

  const formatDate = (date: Date) => formatter.dateTime(date, dateOptions);
  const formatDateTime = (date: Date) =>
    formatter.dateTime(date, dateTimeOptions);
  const formatTime = (date: Date) => formatter.dateTime(date, timeOptions);

  const formatRange = (from: string | Date, to: string | Date) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isSameDay(fromDate, toDate)) {
      return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatTime(toDate)}`;
    }

    return `${formatDateTime(fromDate)} - ${formatDateTime(toDate)}`;
  };

  const formatTimeRange = (from: string | Date, to: string | Date) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    return `${formatTime(fromDate)} - ${formatTime(toDate)}`;
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRange,
    formatTimeRange,
  };
}
