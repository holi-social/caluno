export type GuardedNavigation =
  | { type: 'href'; href: string }
  // delta: history.go() offset that leaves the guarded page, or null when
  // there is no entry before it (direct link / new tab) and the caller must
  // fall back to an explicit navigation.
  | { type: 'back'; delta: number | null };

export interface LinkClickDetails {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: string;
  hasDownloadAttribute: boolean;
  rawHref: string;
}

export function isGuardableLinkClick(
  click: LinkClickDetails,
  currentUrl: URL,
): boolean {
  if (click.button !== 0) return false;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) {
    return false;
  }
  if (click.target && click.target !== '_self') return false;
  if (click.hasDownloadAttribute) return false;
  if (!click.rawHref) return false;

  let url: URL;
  try {
    url = new URL(click.rawHref, currentUrl);
  } catch {
    return false;
  }

  if (url.origin !== currentUrl.origin) return false;
  // Same-page links (e.g. hash jumps) cannot lose form state.
  if (
    url.pathname === currentUrl.pathname &&
    url.search === currentUrl.search
  ) {
    return false;
  }
  return true;
}

export function stripLocalePrefix(
  path: string,
  locales: readonly string[],
): string {
  const segment = path.split('/')[1] ?? '';
  if (!locales.includes(segment)) return path;
  const stripped = path.slice(segment.length + 1);
  return stripped === '' ? '/' : stripped;
}

const GUARD_STATE_KEY = '__unsavedChangesGuard';

/**
 * Tags a history entry's state as pushed by the unsaved-changes guard,
 * preserving any existing state (e.g. Next.js router state).
 */
export function markGuardState(state: unknown): Record<string, unknown> {
  const base = typeof state === 'object' && state !== null ? state : {};
  return { ...base, [GUARD_STATE_KEY]: true };
}

export function isGuardDummyState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as Record<string, unknown>)[GUARD_STATE_KEY] === true
  );
}

/**
 * Computes the history.go() delta that leaves the guarded page after the
 * user confirms a blocked back navigation. When the popstate landed on a
 * guarded-page entry the re-pushed dummy and that entry must be skipped
 * (-2); when it already landed outside the page (e.g. a rapid double back)
 * only the dummy is above the target (-1). Returns null when the guarded
 * page is the first history entry, so the caller can fall back to an
 * explicit navigation instead of a no-op history.go().
 */
export function computeLeaveDelta({
  landedPathname,
  guardedPathname,
  hasPriorEntry,
}: {
  landedPathname: string;
  guardedPathname: string;
  hasPriorEntry: boolean;
}): number | null {
  if (!hasPriorEntry) return null;
  return landedPathname === guardedPathname ? -2 : -1;
}
