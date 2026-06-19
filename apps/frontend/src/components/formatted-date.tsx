'use client';

import { useFormatting } from '@/hooks/use-formatting';

export function FormattedDate({ date }: { date: Date | string }) {
  const { formatDate } = useFormatting();
  const value = new Date(date);

  return <span>{formatDate(value)}</span>;
}
