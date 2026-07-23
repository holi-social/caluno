import type { DocumentKind, PauschalenType } from '../doc-type-header';

export type TemplateSlug =
  | 'ehrenamtspauschale-contract'
  | 'ehrenamtspauschale-invoice'
  | 'uebungsleiterpauschale-contract'
  | 'uebungsleiterpauschale-invoice';

export const SLUG_TO_SLOT: Record<
  TemplateSlug,
  { pauschale: PauschalenType; kind: DocumentKind }
> = {
  'ehrenamtspauschale-contract': { pauschale: 'ehrenamt', kind: 'contract' },
  'ehrenamtspauschale-invoice': { pauschale: 'ehrenamt', kind: 'invoice' },
  'uebungsleiterpauschale-contract': {
    pauschale: 'uebungleiter',
    kind: 'contract',
  },
  'uebungsleiterpauschale-invoice': {
    pauschale: 'uebungleiter',
    kind: 'invoice',
  },
};

export type GatePoint =
  | 'check_in'
  | 'shift_signup'
  | 'document_ep_contract'
  | 'document_ep_invoice'
  | 'document_ul_contract'
  | 'document_ul_invoice';

export interface BlockedAction {
  id: string;
  gate: GatePoint;
}

export interface TemplateSlot {
  slug: TemplateSlug;
  pauschale: PauschalenType;
  kind: DocumentKind;
  configured: boolean;
  blockedActions: BlockedAction[];
}

export interface TemplateSectionData {
  pauschale: PauschalenType;
  slots: [TemplateSlot, TemplateSlot];
}
