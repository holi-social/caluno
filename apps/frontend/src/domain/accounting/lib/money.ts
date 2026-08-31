/** Money is integer cents everywhere in the accounting API — convert at the boundary. */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Hourly-rate formatting that keeps the cents, e.g. 4.5 -> "4,50 €" — unlike
 * `formatEuro` (lib/formatting/formats.ts), which rounds to whole euros.
 * Follows the same hardcoded German-format convention as `formatEuro`.
 */
export function formatHourlyRate(euros: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}
