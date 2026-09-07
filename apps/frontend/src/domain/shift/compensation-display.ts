import { ReimbursementTypeKey } from '@repo/data';

export interface CompensationLabels {
  ehrenamt: string;
  uebungsleiter: string;
}

/**
 * Resolves the volunteer-facing compensation label for a shift, given the
 * reimbursement type key exposed on the volunteer surfaces. Null when the
 * shift is unpaid (no key) — paid indicators are not rendered for unpaid
 * shifts.
 */
export function compensationLabelFor(
  key: ReimbursementTypeKey | null | undefined,
  labels: CompensationLabels,
): string | null {
  switch (key) {
    case ReimbursementTypeKey.Ehrenamt:
      return labels.ehrenamt;
    case ReimbursementTypeKey.Uebungsleiter:
      return labels.uebungsleiter;
    default:
      return null;
  }
}
