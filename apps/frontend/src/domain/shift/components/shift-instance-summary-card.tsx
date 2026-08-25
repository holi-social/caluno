'use client';

import { Card, CardContent, Separator } from '@repo/ui';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

interface ShiftInstanceSummaryCardProps {
  title: string;
  startsAt: Date;
  endsAt: Date;
  children?: ReactNode;
}

export function ShiftInstanceSummaryCard({
  title,
  startsAt,
  endsAt,
  children,
}: ShiftInstanceSummaryCardProps) {
  const locale = useLocale();
  const formatWithOptions = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(date);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return (
    <Card>
      <CardContent className="flex justify-between items-start gap-4">
        <div>
          <p className="text-lg font-semibold">
            {formatWithOptions(startsAt, dateOptions)}
          </p>
          <p className="text-muted-foreground">{title}</p>
        </div>
        <p className="text-lg font-semibold whitespace-nowrap">
          {formatWithOptions(startsAt, timeOptions)} -{' '}
          {formatWithOptions(endsAt, timeOptions)}
        </p>
      </CardContent>
      {children && (
        <>
          <Separator />
          <CardContent>{children}</CardContent>
        </>
      )}
    </Card>
  );
}
