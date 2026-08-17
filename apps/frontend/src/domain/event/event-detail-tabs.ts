export const EventDetailTab = {
  shifts: 'shifts',
  volunteers: 'volunteers',
} as const;

export type EventDetailTab =
  (typeof EventDetailTab)[keyof typeof EventDetailTab];

export function parseEventDetailTab(
  param: string | null | undefined,
): EventDetailTab {
  return param === EventDetailTab.volunteers
    ? EventDetailTab.volunteers
    : EventDetailTab.shifts;
}
