'use client';

import { Badge, Card, CardContent } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { formatDuration } from '@/lib/formatting';
import { getEntryState, type MyTimeEntry } from '../my-time-grouping';

export const MyTimeEntryRow = ({ entry }: { entry: MyTimeEntry }) => {
  const t = useTranslations('MyTime');
  const state = getEntryState(entry);
  const inProgress = state === 'in-progress';
  const duration = inProgress
    ? '—'
    : formatDuration(
        new Date(entry.startedAt),
        new Date(entry.endedAt as string),
      );

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{entry.shiftName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {entry.organizationName} · {entry.organizationUnitName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className="tabular-nums">{duration}</span>
          <Badge variant={inProgress ? 'info' : 'success'}>
            {t(inProgress ? 'state.inProgress' : 'state.completed')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
