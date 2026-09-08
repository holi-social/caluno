import { describe, expect, it } from 'bun:test';
import type { WeeklyShiftInstance } from '@repo/data';
import {
  filterByTitle,
  instancesOnDate,
  sortByStartsAt,
  type TimeEntryShiftInstance,
  toTimeEntryShiftInstance,
} from '../shift-instance-options';

const makeRaw = (
  overrides: Partial<WeeklyShiftInstance> = {},
): WeeklyShiftInstance =>
  ({
    id: 'instance-1',
    actualStartsAt: '2026-09-08T13:00:00.000Z',
    actualEndsAt: '2026-09-08T16:00:00.000Z',
    isCancelled: false,
    master: { id: 'shift-1', title: 'Morning shift' },
    ...overrides,
  }) as WeeklyShiftInstance;

describe('toTimeEntryShiftInstance', () => {
  it('prefers the override title over the master title', () => {
    const instance = toTimeEntryShiftInstance(
      makeRaw({ overrideTitle: 'Special morning' }),
    );
    expect(instance.title).toBe('Special morning');
    expect(instance.masterId).toBe('shift-1');
  });

  it('falls back to the master title', () => {
    const instance = toTimeEntryShiftInstance(makeRaw());
    expect(instance.title).toBe('Morning shift');
  });
});

describe('instancesOnDate', () => {
  const instances: TimeEntryShiftInstance[] = [
    {
      id: 'a',
      masterId: '1',
      title: 'A',
      actualStartsAt: '2026-09-08T08:00:00Z',
      actualEndsAt: '2026-09-08T10:00:00Z',
    },
    {
      id: 'b',
      masterId: '1',
      title: 'B',
      actualStartsAt: '2026-09-09T08:00:00Z',
      actualEndsAt: '2026-09-09T10:00:00Z',
    },
    {
      id: 'c',
      masterId: '2',
      title: 'C',
      actualStartsAt: '2026-09-08T18:00:00Z',
      actualEndsAt: '2026-09-08T20:00:00Z',
    },
  ];

  it('keeps only the instances that run on the given day', () => {
    const result = instancesOnDate(instances, new Date('2026-09-08T12:00:00Z'));
    expect(result.map((i) => i.id).sort()).toEqual(['a', 'c']);
  });
});

describe('sortByStartsAt', () => {
  it('orders by earliest start first without mutating the input', () => {
    const instances: TimeEntryShiftInstance[] = [
      {
        id: 'later',
        masterId: '1',
        title: 'Later',
        actualStartsAt: '2026-09-08T18:00:00Z',
        actualEndsAt: '2026-09-08T20:00:00Z',
      },
      {
        id: 'earlier',
        masterId: '1',
        title: 'Earlier',
        actualStartsAt: '2026-09-08T08:00:00Z',
        actualEndsAt: '2026-09-08T10:00:00Z',
      },
    ];
    const result = sortByStartsAt(instances);
    expect(result.map((i) => i.id)).toEqual(['earlier', 'later']);
    // The input is not mutated, so 'later' stays first.
    expect(instances[0]?.id).toBe('later');
  });
});

describe('filterByTitle', () => {
  const instances: TimeEntryShiftInstance[] = [
    {
      id: 'a',
      masterId: '1',
      title: 'Food Distribution',
      actualStartsAt: '2026-09-08T08:00:00Z',
      actualEndsAt: '2026-09-08T10:00:00Z',
    },
    {
      id: 'b',
      masterId: '1',
      title: 'Community Support',
      actualStartsAt: '2026-09-08T08:00:00Z',
      actualEndsAt: '2026-09-08T10:00:00Z',
    },
  ];

  it('matches a case-insensitive substring', () => {
    expect(filterByTitle(instances, 'food').map((i) => i.id)).toEqual(['a']);
    expect(filterByTitle(instances, 'SUPPORT').map((i) => i.id)).toEqual(['b']);
  });

  it('returns everything when the search is empty', () => {
    expect(filterByTitle(instances, '').length).toBe(2);
  });
});
