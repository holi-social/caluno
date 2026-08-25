import type { DocumentKind, PauschalenType } from '../doc-type-header';
import type { InvoiceNumberFormat } from './builder-types';

export type SigneeRole = 'volunteer' | 'coordinator' | 'supervisor';

export interface OrgRole {
  id: string;
  name: string;
}

export interface Signee {
  id: string;
  role: SigneeRole;
  orgRole: OrgRole;
}

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
    pauschale: 'uebungsleiter',
    kind: 'contract',
  },
  'uebungsleiterpauschale-invoice': {
    pauschale: 'uebungsleiter',
    kind: 'invoice',
  },
};

export interface ContractCardSummary {
  task: string;
  hourlyRate: string;
}

export interface InvoiceCardSummary {
  /** Only shown when the template's Kostenstelle line is enabled. */
  kostenstelle?: string;
  /** Only shown when the template's Kostenträger line is enabled. */
  kostentraeger?: string;
  /** Only shown when the template's Rechtsträger line is enabled. */
  rechtstraeger?: string;
  invoiceNumberFormat: InvoiceNumberFormat;
}

export type TemplateCardSummary = ContractCardSummary | InvoiceCardSummary;

export type TemplateSlot =
  | {
      slug: TemplateSlug;
      pauschale: PauschalenType;
      kind: DocumentKind;
      configured: false;
    }
  | {
      slug: TemplateSlug;
      pauschale: PauschalenType;
      kind: DocumentKind;
      configured: true;
      summary: TemplateCardSummary;
      lastEditedAt: string;
      lastEditedBy: string;
    };

export interface TemplateSectionData {
  pauschale: PauschalenType;
  slots: [TemplateSlot, TemplateSlot];
}
