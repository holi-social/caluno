export function eventsListPath(orgUId: string): string {
  return `/admin/${orgUId}/events`;
}

export function eventDetailPath(orgUId: string, eventId: string): string {
  return `/admin/${orgUId}/events/${eventId}`;
}

export function inviteEventPath(orgUId: string, eventId: string): string {
  return `/admin/${orgUId}/events/${eventId}/invite`;
}

export function eventShiftNewPath(orgUId: string, eventId: string): string {
  return `/admin/${orgUId}/events/${eventId}/shifts/new`;
}

export function eventShiftEditPath(
  orgUId: string,
  eventId: string,
  shiftId: string,
): string {
  return `/admin/${orgUId}/events/${eventId}/shifts/${shiftId}/edit`;
}

export function eventShiftInvitePath(
  orgUId: string,
  eventId: string,
  shiftId: string,
  instanceId: string,
): string {
  return `/admin/${orgUId}/events/${eventId}/shifts/${shiftId}/invite?instanceId=${encodeURIComponent(instanceId)}`;
}
