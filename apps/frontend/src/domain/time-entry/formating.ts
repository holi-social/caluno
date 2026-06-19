import type { GetTimeEntriesQuery } from '@repo/data';

import {
  formatDuration as formatDateDuration,
  formatDateTime,
  formatRange,
} from '@/lib/formatting';

type TimeEntry = GetTimeEntriesQuery['timeEntries']['items'][number];

export const formatTimeRange = (entry: TimeEntry, openLabel = 'open') => {
  const start = new Date(entry.startedAt);

  if (entry.endedAt) {
    const end = new Date(entry.endedAt);
    return formatRange(start, end);
  }
  return `${formatDateTime(start)} - ${openLabel}`;
};

export const formatDuration = (entry: TimeEntry) => {
  const start = new Date(entry.startedAt);
  const end = entry.endedAt ? new Date(entry.endedAt) : new Date();
  return formatDateDuration(start, end);
};
