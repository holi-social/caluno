import { centsToEuros, eurosToCents } from './money';

/** The manually-set initial cap amount in euros; a missing baseline reads as zero. */
export function initialCapAmountEuros(
  amountCents: number | null | undefined,
): number {
  return centsToEuros(amountCents ?? 0);
}

/** Parses a user-entered euro amount (comma or dot decimal) into whole cents; null when unparseable or negative. */
export function parseEuroInputToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') return null;
  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros < 0) return null;
  return eurosToCents(euros);
}

/** The projected year-to-date cap amount after this invoice. */
export function projectedCapAmount(
  usedBefore: number,
  selectedAmount: number,
): number {
  return usedBefore + selectedAmount;
}
