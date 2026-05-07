import type { GetTimeEntriesQuery } from '@repo/data';

type TimeEntry = GetTimeEntriesQuery['timeEntries']['items'][number];

import {
  formatDuration as formatDateDuration,
  formatDateTime,
  formatRange,
} from '@/lib/formatting';

export const formatTimeRange = (entry: TimeEntry) => {
  const start = new Date(entry.startedAt);

  if (entry.endedAt) {
    const end = new Date(entry.endedAt);
    return formatRange(start, end);
  } else {
    return `${formatDateTime(start)} - open`;
  }
};

export const formatDuration = (entry: TimeEntry) => {
  const start = new Date(entry.startedAt);
  const end = entry.endedAt ? new Date(entry.endedAt) : new Date();
  return formatDateDuration(start, end);
};
