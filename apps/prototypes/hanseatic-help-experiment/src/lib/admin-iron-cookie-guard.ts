/** Loose check for Next.js `proxy` (Edge): iron seal is long and versioned with `~`. */
export function ironSessionCookieLooksPlausible(raw: string | undefined): boolean {
  return Boolean(raw && raw.length > 80 && raw.includes('~'));
}
