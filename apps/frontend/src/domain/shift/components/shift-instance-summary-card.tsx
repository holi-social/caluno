'use client';

import { Card, CardContent, Separator } from '@repo/ui';
import type { ReactNode } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';

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
  const { formatDate, formatTimeRange } = useFormatting();

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  };

  return (
    <Card>
      <CardContent className="flex justify-between items-start gap-4">
        <div>
          <p className="text-lg font-semibold">
            {formatDate(startsAt, dateOptions)}
          </p>
          <p className="text-muted-foreground">{title}</p>
        </div>
        <p className="text-lg font-semibold whitespace-nowrap">
          {formatTimeRange(startsAt, endsAt)}
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
