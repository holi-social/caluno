/** Whether the org has any shift definitions (not week instances). */
export function orgHasShifts(total: number): boolean {
  return total > 0;
}
