export type ShiftListView = 'weekplan' | 'shifts';

const CHECK_IN_URL_PATTERN = /\/admin\/check-in\/([a-z0-9]{12})(?:[/?#]|$)/i;

export function extractCheckInPath(scannedValue: string): string | null {
  const match = scannedValue.match(CHECK_IN_URL_PATTERN);
  return match ? `/admin/check-in/${match[1]?.toLowerCase()}` : null;
}

export type ShiftListQuery = {
  view?: ShiftListView;
  week?: string;
  page?: string;
};

function parseQuery(query?: ShiftListQuery) {
  const params = new URLSearchParams();
  if (query?.view) params.set('view', query.view);
  if (query?.week) params.set('week', query.week);
  if (query?.page) params.set('page', query.page);
  return params.toString();
}

export function shiftsListPath(
  orgUId: string,
  query: ShiftListQuery = {},
): string {
  const queryString = parseQuery(query);
  return `/admin/${orgUId}/shifts${queryString ? `?${queryString}` : ''}`;
}

export function shiftDetailPath(
  orgUId: string,
  shiftId: string,
  query?: ShiftListQuery,
): string {
  const queryString = parseQuery(query);
  return `/admin/${orgUId}/shifts/${shiftId}${queryString ? `?${queryString}` : ''}`;
}

export function shiftNewPath(orgUId: string): string {
  return `/admin/${orgUId}/shifts/new`;
}

export function shiftEditPath(orgUId: string, shiftId: string): string {
  return `/admin/${orgUId}/shifts/${shiftId}/edit`;
}

export function shiftInvitePath(
  orgUId: string,
  shiftId: string,
  instanceId: string,
  options?: { flow?: 'create' },
): string {
  const params = new URLSearchParams({ instanceId });
  if (options?.flow) {
    params.set('flow', options.flow);
  }
  return `/admin/${orgUId}/shifts/${shiftId}/invite?${params.toString()}`;
}

export function shiftInstanceDetailPath(
  orgUId: string,
  shiftId: string,
  instanceId: string,
  query?: ShiftListQuery,
): string {
  const queryString = parseQuery(query);
  return `/admin/${orgUId}/shifts/${shiftId}/instances/${instanceId}${queryString ? `?${queryString}` : ''}`;
}

export function shiftInstanceEditPath(
  orgUId: string,
  shiftId: string,
  instanceId: string,
): string {
  return `/admin/${orgUId}/shifts/${shiftId}/instances/${instanceId}/edit`;
}

export function parseShiftListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ShiftListQuery {
  const view = searchParams.view;
  const week = searchParams.week;
  const page = searchParams.page;

  return {
    view:
      view === 'shifts'
        ? 'shifts'
        : view === 'weekplan'
          ? 'weekplan'
          : undefined,
    week: typeof week === 'string' ? week : undefined,
    page: typeof page === 'string' ? page : undefined,
  };
}
