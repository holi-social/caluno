'use client';

import type { MyTimeEntryItem } from '@repo/data';
import { useMyTimeEntries } from '@repo/data/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@repo/ui';
import { addDays, format, isSameMonth, startOfWeek } from 'date-fns';
import { Clock3, FileClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { formatDuration } from '@/lib/formatting';

type VerificationState = 'open' | 'awaiting' | 'verified';

const verificationState = (entry: MyTimeEntryItem): VerificationState =>
  entry.endedAt ? 'awaiting' : 'open';

const entryDurationMs = (entry: MyTimeEntryItem) => {
  const start = new Date(entry.startedAt).getTime();
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : Date.now();
  return Math.max(0, end - start);
};

const formatMs = (ms: number) => formatDuration(new Date(0), new Date(ms));

const weekStartOf = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

const weekLabel = (weekStart: Date) => {
  const end = addDays(weekStart, 6);
  const startPart = isSameMonth(weekStart, end)
    ? format(weekStart, 'd')
    : format(weekStart, 'd MMM');
  return `${startPart} – ${format(end, 'd MMM')}`;
};

type WeekGroup = {
  weekStart: Date;
  entries: MyTimeEntryItem[];
  totalMs: number;
};

const groupByWeek = (items: MyTimeEntryItem[]): WeekGroup[] => {
  // Entries arrive newest-first from the server; preserve that order so the
  // most recent week is shown first.
  const groups = new Map<number, MyTimeEntryItem[]>();
  for (const item of items) {
    const key = weekStartOf(new Date(item.startedAt)).getTime();
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return [...groups.entries()].map(([weekStartMs, entries]) => ({
    weekStart: new Date(weekStartMs),
    entries,
    totalMs: entries.reduce((sum, entry) => sum + entryDurationMs(entry), 0),
  }));
};

const verificationVariant: Record<VerificationState, 'secondary' | 'outline'> =
  {
    open: 'secondary',
    awaiting: 'outline',
    verified: 'outline',
  };

const MyTimeEntryCard = ({ entry }: { entry: MyTimeEntryItem }) => {
  const t = useTranslations('TimeEntry.myTime');
  const state = verificationState(entry);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium leading-tight">{entry.shiftName}</span>
          <Badge variant={verificationVariant[state]}>
            {t(`verification.${state}`)}
          </Badge>
        </div>
        <span className="text-muted-foreground text-sm">
          {entry.organizationName} · {entry.organizationUnitName}
        </span>
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <Clock3 className="size-3.5" />
          <span className="font-medium text-foreground">
            {formatMs(entryDurationMs(entry))}
          </span>
          <span>· {t('duration')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const MyTime = () => {
  const t = useTranslations('TimeEntry.myTime');
  const tNav = useTranslations('Navigation');
  const { data, isPending } = useMyTimeEntries({ limit: 50 });

  const weeks = useMemo(() => groupByWeek(data?.items ?? []), [data]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-7 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="page-title">{tNav('myTime')}</h1>
        <Empty className="border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileClock />
            </EmptyMedia>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.description')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/">{t('empty.cta')}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">{tNav('myTime')}</h1>
      {weeks.map(({ weekStart, entries, totalMs }) => (
        <section
          key={weekStart.getTime()}
          className="flex flex-col gap-2"
          aria-label={weekLabel(weekStart)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-muted-foreground text-sm font-medium">
              {weekLabel(weekStart)}
            </h2>
            <span className="text-sm font-semibold">
              {t('weekTotal', { duration: formatMs(totalMs) })}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <MyTimeEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
