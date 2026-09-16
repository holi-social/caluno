import type { RawAccountingSetupStatus } from '@repo/data';
import type { PauschalenType } from '../components/doc-type-header';
import { pauschaleForReimbursementTypeKey } from './reimbursement-type-mapping';

export type SetupBlocker =
  | { kind: 'org-profile'; missingFields: string[] }
  | { kind: 'templates'; pauschalen: PauschalenType[] };

export interface PauschaleTemplateReadiness {
  contract: boolean;
  invoice: boolean;
}

export type TemplateReadinessByPauschale = Partial<
  Record<PauschalenType, PauschaleTemplateReadiness>
>;

/** Per-Pauschale template state, so a single row can be blocked before it is clicked. */
export function templateReadinessByPauschale(
  status: RawAccountingSetupStatus | undefined,
): TemplateReadinessByPauschale {
  const readiness: TemplateReadinessByPauschale = {};
  for (const slot of status?.slots ?? []) {
    readiness[pauschaleForReimbursementTypeKey(slot.reimbursementTypeKey)] = {
      contract: slot.hasContractTemplate,
      invoice: slot.hasInvoiceTemplate,
    };
  }
  return readiness;
}

/**
 * Whether creating a document of `kind` for `pauschale` would dead-end on a
 * missing template. A contract needs its contract template; an invoice also
 * auto-drafts a contract, so it needs both. An unknown type fails closed.
 */
export function documentCreationBlockedFor(
  readiness: TemplateReadinessByPauschale,
  pauschale: PauschalenType,
  kind: 'contract' | 'invoice',
): boolean {
  const type = readiness[pauschale];
  if (!type) return true;
  if (kind === 'contract') return !type.contract;
  return !(type.contract && type.invoice);
}

/** What stops the admin from authoring templates, if anything. */
export function templateSetupBlocker(
  status: RawAccountingSetupStatus | undefined,
): SetupBlocker | null {
  if (!status) return null;
  if (status.orgProfileComplete) return null;
  return { kind: 'org-profile', missingFields: status.missingOrgProfileFields };
}

/**
 * What stops the admin from creating documents, if anything. Org profile wins
 * when both gates are unmet: templates cannot be authored until it is filled,
 * so pointing at the template builder would dead-end them.
 */
export function documentCreationBlocker(
  status: RawAccountingSetupStatus | undefined,
): SetupBlocker | null {
  if (!status) return null;
  const orgBlocker = templateSetupBlocker(status);
  if (orgBlocker) return orgBlocker;
  if (status.canCreateDocuments) return null;
  const pauschalen = status.slots
    .filter((slot) => !slot.ready)
    .map((slot) => pauschaleForReimbursementTypeKey(slot.reimbursementTypeKey));
  // No unready slot to name (e.g. no reimbursement types at all): nothing to
  // point the admin at, so report no blocker rather than a dangling "missing:".
  if (pauschalen.length === 0) return null;
  return { kind: 'templates', pauschalen };
}
