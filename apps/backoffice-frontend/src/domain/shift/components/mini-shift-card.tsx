'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Clock, Folder } from 'lucide-react';
import { formatRange } from '@/lib/formatting';

type MiniShiftCardProps = {
  title: string;
  startsAt: string;
  endsAt: string;
  project?: { id: string; title: string } | null;
};

export function MiniShiftCard({
  title,
  startsAt,
  endsAt,
  project,
}: MiniShiftCardProps) {
  return (
    <Card className="p-2 gap-1 rounded-sm w-full">
      <CardHeader className="p-0 gap-0">
        <CardTitle className="truncate">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {project && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-0.5">
            <Folder className="size-3 shrink-0" /> {project.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Clock className="size-3 shrink-0" /> {formatRange(startsAt, endsAt)}
        </p>
      </CardContent>
    </Card>
  );
}
