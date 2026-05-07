/**
 * Prototype formatting helpers. Mirrors apps/frontend/src/lib/formatting.ts
 * by name, but takes ISO strings (not Date) and forces de-DE because all
 * user-facing copy in this prototype is German.
 */

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Render a single submission value cell. */
export function formatSubmissionValue(
  value: string | boolean | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Ja' : 'Nein';
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return '-';
}
