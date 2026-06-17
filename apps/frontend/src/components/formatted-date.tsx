'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/formatting';

export function FormattedDate({ date }: { date: Date | string }) {
  const time = new Date(date).getTime();
  const [formatted, setFormatted] = useState(() => formatDate(new Date(time)));

  useEffect(() => {
    setFormatted(formatDate(new Date(time), navigator.language));
  }, [time]);

  return <span>{formatted}</span>;
}
