import { Badge, Card, CardContent } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { getEntryState, type TimeEntry } from '../my-time-grouping';

export const MyTimeEntryRow = ({ entry }: { entry: TimeEntry }) => {
  const t = useTranslations('MyTime');
  const { formatDuration } = useFormatting();

  const state = getEntryState(entry);
  const shift = entry.shiftInstance.master;
  const organizationUnit = shift.organizationUnit;
  const inProgress = state === 'in-progress';
  const duration = inProgress
    ? ''
    : formatDuration(entry.startedAt, entry.endedAt);

  return (
    <Card className="py-4">
      <CardContent className="">
        <h2 className="truncate">
          {entry.shiftInstance.overrideTitle ?? shift.title}
        </h2>
        <h3 className="truncate text-sm text-muted-foreground">
          {organizationUnit.organization.name} · {organizationUnit.name}
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
