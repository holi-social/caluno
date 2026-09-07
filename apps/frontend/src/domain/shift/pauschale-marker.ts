import type { ReimbursementTypeKey } from '@repo/data';
import type { PauschalenType } from '../accounting/components/doc-type-header';
import { pauschaleForReimbursementTypeKey } from '../accounting/lib/reimbursement-type-mapping';

export type PauschaleMarkerKind = PauschalenType;

export interface ReimbursementTypeLookup {
  id: string;
  key: ReimbursementTypeKey;
}

/**
 * Resolves which Pauschale marker (if any) a shift/instance should show,
 * given its effective reimbursement type id (instance override falling back
 * to the master shift's type) and the org's available reimbursement types.
 *
 * Returns null when the shift is unpaid (no id set) or the type can't be
 * resolved yet (types still loading, or an id that no longer matches a known
 * type) — callers must render no marker in both cases. There is
 * intentionally no "unpaid" state: unpaid shifts carry no marker at all.
 */
export function resolvePauschaleMarker(
  reimbursementTypeId: string | null | undefined,
  types: ReimbursementTypeLookup[] | null | undefined,
): PauschaleMarkerKind | null {
  if (!reimbursementTypeId || !types) {
    return null;
  }

  const match = types.find((type) => type.id === reimbursementTypeId);
  if (!match) {
    return null;
  }

  return pauschaleForReimbursementTypeKey(match.key);
}
