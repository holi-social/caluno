import { getFormatter } from 'next-intl/server';

export async function getFormatting() {
  const formatter = await getFormatter();

  return {
    formatDate: (date: Date) =>
      formatter.dateTime(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    formatDateTime: (date: Date) =>
      formatter.dateTime(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    formatTime: (date: Date) =>
      formatter.dateTime(date, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
  };
}
