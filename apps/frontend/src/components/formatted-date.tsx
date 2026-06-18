'use client';

import { useFormatter } from 'next-intl';

export function FormattedDate({ date }: { date: Date | string }) {
  const formatter = useFormatter();
  const value = new Date(date);

  return (
    <span>
      {formatter.dateTime(value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}
    </span>
  );
}
