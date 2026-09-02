import { DEFAULT_APP_URL } from './theme';

/**
 * Escapes user-provided values before interpolating them into email markup.
 * Always run untrusted strings through this before placing them in HTML.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapes plain text and preserves line breaks for email HTML. */
export function formatMultilineHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

/**
 * Normalizes WEB_URL (falling back to the production default)
 * by stripping any trailing slashes so paths can be appended safely.
 */
export function resolveAppUrl(): string {
  return (process.env.WEB_URL ?? DEFAULT_APP_URL).replace(/\/+$/, '');
}

/** Deep link to an organization's admin dashboard, keyed by its root unit id. */
export function organizationAdminUrl(organizationUnitId: string): string {
  return `${resolveAppUrl()}/admin/${encodeURIComponent(organizationUnitId)}`;
}

/** Deep link to the volunteers admin page for reviewing membership requests. */
export function volunteersAdminUrl(organizationUnitId: string): string {
  return `${resolveAppUrl()}/admin/${encodeURIComponent(organizationUnitId)}/volunteers`;
}

/** Deep link to the shifts admin page for managing schedules. */
export function shiftsAdminUrl(organizationUnitId: string): string {
  return `${resolveAppUrl()}/admin/${encodeURIComponent(organizationUnitId)}/shifts`;
}

/** Public deep link to a shift, optionally scoped to a specific instance. */
export function shiftPublicUrl(shiftId: string, instanceId?: string): string {
  const path = `/shifts/${encodeURIComponent(shiftId)}`;
  if (!instanceId) {
    return `${resolveAppUrl()}${path}`;
  }

  return `${resolveAppUrl()}${path}?instanceId=${encodeURIComponent(instanceId)}`;
}

/** Public deep link to an event. */
export function eventPublicUrl(eventId: string): string {
  return `${resolveAppUrl()}/events/${encodeURIComponent(eventId)}`;
}

/** Deep link to the events admin page for managing an org unit's events. */
export function eventsAdminUrl(organizationUnitId: string): string {
  return `${resolveAppUrl()}/admin/${encodeURIComponent(organizationUnitId)}/events`;
}

/**
 * Deep link to the volunteer's profile — its "Your organizations" section
 * links into each membership, whose page holds "Your documents". There is no
 * standalone /profile/memberships route, so the profile is the closest valid
 * target.
 */
export function volunteerProfileUrl(): string {
  return `${resolveAppUrl()}/profile`;
}
