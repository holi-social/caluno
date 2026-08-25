import type { MyEvent, MyShiftInstance } from '@repo/data/react';

/** Merge shift + event invites into one list sorted by start time. */
export function mergeInvitations<
  S extends { id: string; actualStartsAt: string },
  E extends { id: string; startsAt: string },
>(shifts: S[], events: E[]) {
  return [
    ...shifts.map((shift) => ({
      kind: 'shift' as const,
      id: shift.id,
      startsAt: shift.actualStartsAt,
      shift,
    })),
    ...events.map((event) => ({
      kind: 'event' as const,
      id: event.id,
      startsAt: event.startsAt,
      event,
    })),
  ].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export type MergedInvitation = ReturnType<
  typeof mergeInvitations<MyShiftInstance, MyEvent>
>[number];
