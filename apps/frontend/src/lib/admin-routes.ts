/** Absolute backoffice path for an org unit overview/detail page. */
export function orgUnitAdminHref(orgUnitId: string) {
  return `/admin/${orgUnitId}`;
}

/**
 * Preserve the current admin sub-path when switching org units in the sidebar.
 * `/admin/{current}/settings/org-units` → `/admin/{next}/settings/org-units`
 */
export function switchOrgAdminHref(orgUnitId: string, pathname: string) {
  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts[0] !== 'admin' || pathParts.length < 2) {
    return orgUnitAdminHref(orgUnitId);
  }

  const subPath = pathParts.slice(2).join('/');
  return subPath
    ? `${orgUnitAdminHref(orgUnitId)}/${subPath}`
    : orgUnitAdminHref(orgUnitId);
}
