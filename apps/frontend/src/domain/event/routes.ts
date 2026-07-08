export function eventsListPath(orgUId: string): string {
  return `/admin/${orgUId}/events`;
}

export function eventDetailPath(orgUId: string, eventId: string): string {
  return `/admin/${orgUId}/events/${eventId}`;
}
