import type { DocumentKind, PauschalenType } from '../doc-type-header';

export type TemplateSlug =
  | 'ehrenamtspauschale-contract'
  | 'ehrenamtspauschale-invoice'
  | 'uebungsleiterpauschale-contract'
  | 'uebungsleiterpauschale-invoice';

export type SigneeRole =
  | 'volunteer'
  | 'coordinator'
  | 'hq_manager'
  | 'supervisor';

export type GatePoint =
  | 'check_in'
  | 'shift_signup'
  | 'document_ep_contract'
  | 'document_ep_invoice'
  | 'document_ul_contract'
  | 'document_ul_invoice';

export interface Signee {
  id: string;
  role: SigneeRole;
  /** Bound org Role — when set, display name comes from here instead of the generic i18n label. */
  orgRole?: { id: string; name: string } | null;
}

export interface BlockedAction {
  id: string;
  gate: GatePoint;
}

export interface TemplateSlot {
  slug: TemplateSlug;
  pauschale: PauschalenType;
  kind: DocumentKind;
  configured: boolean;
  signees: Signee[];
  blockedActions: BlockedAction[];
}

export interface TemplateSectionData {
  pauschale: PauschalenType;
  slots: [TemplateSlot, TemplateSlot];
}
