export function hasFileSelection({
  value,
  initialPreviewUrl,
  initialCleared,
}: {
  value?: string | null;
  initialPreviewUrl?: string | null;
  initialCleared: boolean;
}): boolean {
  const effectiveInitialPreviewUrl = initialCleared ? null : initialPreviewUrl;
  return Boolean(value || effectiveInitialPreviewUrl);
}
