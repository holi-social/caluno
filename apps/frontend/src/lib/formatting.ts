import {
  formatDuration as dateFnsFormatDuration,
  intervalToDuration,
} from 'date-fns';

export const formatDateTime = (date: Date) =>
  date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const formatTime = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const formatRange = (from: string | Date, to: string | Date) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const isSameDay =
    fromDate.getDate() === toDate.getDate() &&
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getFullYear() === toDate.getFullYear();

  if (isSameDay) {
    return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatTime(toDate)}`;
  } else {
    return `${formatDateTime(fromDate)} - ${formatDateTime(toDate)}`;
  }
};

export const formatDuration = (start: Date, end: Date) => {
  const duration = intervalToDuration({ start, end });
  return dateFnsFormatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
  });
};
