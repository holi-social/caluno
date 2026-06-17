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

/**
 * Normalizes the configured web app URL (falling back to the production default)
 * by stripping any trailing slashes so paths can be appended safely.
 */
export function resolveAppUrl(appUrl?: string): string {
  return (appUrl ?? DEFAULT_APP_URL).replace(/\/+$/, '');
}

/** Deep link to an organization's admin dashboard, keyed by its root unit id. */
export function organizationAdminUrl(
  appUrl: string | undefined,
  organizationUnitId: string,
): string {
  return `${resolveAppUrl(appUrl)}/admin/${encodeURIComponent(organizationUnitId)}`;
}

/** Deep link to the volunteers admin page for reviewing membership requests. */
export function volunteersAdminUrl(
  appUrl: string | undefined,
  organizationUnitId: string,
): string {
  return `${resolveAppUrl(appUrl)}/admin/${encodeURIComponent(organizationUnitId)}/volunteers`;
}
