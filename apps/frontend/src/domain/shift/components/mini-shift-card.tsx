'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Clock } from 'lucide-react';
import { formatRange } from '@/lib/formatting';

type MiniShiftCardProps = {
  title: string;
  startsAt: string;
  endsAt: string;
};

export function MiniShiftCard({ title, startsAt, endsAt }: MiniShiftCardProps) {
  return (
    <Card className="p-2 gap-1 rounded-sm w-full">
      <CardHeader className="p-0 gap-0">
        <CardTitle className="truncate">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Clock className="size-3 shrink-0" /> {formatRange(startsAt, endsAt)}
        </p>
      </CardContent>
    </Card>
  );
}
