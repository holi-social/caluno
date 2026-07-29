import { getEffectivePauschaleRate } from '../../mock-rates';
import type { PauschalenType } from '../doc-type-header';
import {
  formatRateComma,
  getContractDocument,
  getInvoiceDocument,
} from './builder-document-presets';
import type { TemplateDocument } from './builder-types';
import { updateManualFieldValue } from './builder-types';
import type {
  ContractCardSummary,
  InvoiceCardSummary,
  TemplateSlug,
} from './types';

/**
 * Single mock "saved template" store — every slot configured, manual fields
 * filled — so the template-builder settings cards and the document-creation
 * modals always read the same four templates instead of drifting into their
 * own separate placeholder content. Stands in for `DocumentTemplate.body`
 * until the real backend/mutation exists (see .ai/design/specs/voli-676/data-model.md).
 */

function enableLines(
  doc: TemplateDocument,
  lineIds: string[],
): TemplateDocument {
  const idSet = new Set(lineIds);
  return {
    ...doc,
    blocks: doc.blocks.map((block) =>
      block.kind === 'text'
        ? {
            ...block,
            lines: block.lines.map((line) =>
              idSet.has(line.id) ? { ...line, enabled: true } : line,
            ),
          }
        : block,
    ),
  };
}

function withManualValues(
  doc: TemplateDocument,
  values: Record<string, string>,
): TemplateDocument {
  return Object.entries(values).reduce(
    (acc, [fieldId, value]) => updateManualFieldValue(acc, fieldId, value),
    doc,
  );
}

const CONTRACT_TASKS: Record<PauschalenType, string> = {
  ehrenamt: 'Betreuung von Kindern und Jugendlichen bei Freizeitaktivitäten',
  uebungleiter: 'Leitung des wöchentlichen Übungsleitertrainings',
};

/** Default per-document values — the creation modal seeds its editable fields from these, then lets the admin adjust per volunteer. */
export const CONTRACT_DEFAULT_LIFESPAN: Record<PauschalenType, string> = {
  ehrenamt: '01/2026',
  uebungleiter: '01/2026',
};

export const CONTRACT_DEFAULT_HOURS_PER_WEEK: Record<PauschalenType, string> = {
  ehrenamt: '4',
  uebungleiter: '6',
};

const INVOICE_KOSTENSTELLE: Partial<Record<TemplateSlug, string>> = {
  'uebungsleiterpauschale-invoice': 'K-4200',
};

function buildContractTemplate(pauschale: PauschalenType): TemplateDocument {
  const withLines = enableLines(getContractDocument(pauschale), [
    'volunteer-address',
    'volunteer-dob',
  ]);
  return withManualValues(withLines, {
    'contract-lifespan': CONTRACT_DEFAULT_LIFESPAN[pauschale],
    tasks: CONTRACT_TASKS[pauschale],
    'hours-per-week': CONTRACT_DEFAULT_HOURS_PER_WEEK[pauschale],
  });
}

function buildInvoiceTemplate(
  pauschale: PauschalenType,
  slug: TemplateSlug,
): TemplateDocument {
  const base = getInvoiceDocument(pauschale);
  const kostenstelle = INVOICE_KOSTENSTELLE[slug];
  if (!kostenstelle) return base;
  const withLine = enableLines(base, ['meta-kostenstelle']);
  return {
    ...withManualValues(withLine, { kostenstelle }),
    invoiceNumberFormat: 'kostenstelle-month-year-number',
  };
}

export function templateSlugFor(
  pauschale: PauschalenType,
  kind: 'contract' | 'invoice',
): TemplateSlug {
  const prefix =
    pauschale === 'ehrenamt' ? 'ehrenamtspauschale' : 'uebungsleiterpauschale';
  return `${prefix}-${kind}` as TemplateSlug;
}

export interface SavedTemplate {
  document: TemplateDocument;
  summary: ContractCardSummary | InvoiceCardSummary;
  lastEditedAt: string;
  lastEditedBy: string;
}

function contractSummary(pauschale: PauschalenType): ContractCardSummary {
  return {
    task: CONTRACT_TASKS[pauschale],
    hourlyRate: formatRateComma(getEffectivePauschaleRate(pauschale)),
  };
}

export const MOCK_SAVED_TEMPLATES: Record<TemplateSlug, SavedTemplate> = {
  'ehrenamtspauschale-contract': {
    document: buildContractTemplate('ehrenamt'),
    summary: contractSummary('ehrenamt'),
    lastEditedAt: '2026-07-18T10:30:00Z',
    lastEditedBy: 'Julia Bauer',
  },
  'ehrenamtspauschale-invoice': {
    document: buildInvoiceTemplate('ehrenamt', 'ehrenamtspauschale-invoice'),
    summary: { invoiceNumberFormat: 'date-number' },
    lastEditedAt: '2026-06-20T09:00:00Z',
    lastEditedBy: 'Julia Bauer',
  },
  'uebungsleiterpauschale-contract': {
    document: buildContractTemplate('uebungleiter'),
    summary: contractSummary('uebungleiter'),
    lastEditedAt: '2026-05-11T16:45:00Z',
    lastEditedBy: 'Jonas Weber',
  },
  'uebungsleiterpauschale-invoice': {
    document: buildInvoiceTemplate(
      'uebungleiter',
      'uebungsleiterpauschale-invoice',
    ),
    summary: {
      kostenstelle: INVOICE_KOSTENSTELLE['uebungsleiterpauschale-invoice'],
      invoiceNumberFormat: 'kostenstelle-month-year-number',
    },
    lastEditedAt: '2026-06-02T14:15:00Z',
    lastEditedBy: 'Jonas Weber',
  },
};
