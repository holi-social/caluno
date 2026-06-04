'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/formatting';

export function FormattedDate({ date }: { date: Date | string }) {
  const parsed = new Date(date);
  const [formatted, setFormatted] = useState(() => formatDate(parsed));

  useEffect(() => {
    setFormatted(formatDate(parsed, navigator.language));
  }, [parsed.getTime()]);

  return <span>{formatted}</span>;
}
