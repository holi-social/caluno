export function isSafeRedirect(url: string | undefined): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//');
}

export function getSafeRedirect(
  url: string | undefined,
  fallback = '/',
): string {
  return isSafeRedirect(url) ? url : fallback;
}
