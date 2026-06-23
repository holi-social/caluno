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
    <Card className="py-4">
      <CardContent className="">
        <h2 className="truncate">{entry.shiftName}</h2>
        <h3 className="truncate text-sm text-muted-foreground">
          {entry.organizationName} · {entry.organizationUnitName}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base">{duration}</span>
          <Badge variant={inProgress ? 'outline' : 'success'}>
            {t(inProgress ? 'state.inProgress' : 'state.completed')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
