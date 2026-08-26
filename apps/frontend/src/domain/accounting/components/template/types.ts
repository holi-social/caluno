import type { InvoiceNumberFormat, RenewalCadence } from '@repo/data';
import type { DocumentKind, PauschalenType } from '../doc-type-header';

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
  kind: 'contract';
  /** Task description — lives in the template body, which the listing query doesn't fetch, so real cards omit it. */
  task?: string;
  /** Effective hourly rate at this org unit, formatted (e.g. "4,50 €"). */
  hourlyRate?: string;
  renewalCadence?: RenewalCadence | null;
  signeeCount?: number;
}

export interface InvoiceCardSummary {
  kind: 'invoice';
  /** Only shown when the template's Kostenstelle line is enabled. */
  kostenstelle?: string;
  /** Only shown when the template's Kostenträger line is enabled. */
  kostentraeger?: string;
  /** Only shown when the template's Rechtsträger line is enabled. */
  rechtstraeger?: string;
  invoiceNumberFormat?: InvoiceNumberFormat;
  renewalCadence?: RenewalCadence | null;
  signeeCount?: number;
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
      templateId: string;
      summary: TemplateCardSummary;
      lastEditedAt: string | null;
      lastEditedBy: string | null;
    };

export interface TemplateSectionData {
  pauschale: PauschalenType;
  slots: [TemplateSlot, TemplateSlot];
}
