'use client';

import { Button } from '@repo/ui';
import { ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePageBreadcrumb } from '@/components/navigation/page-header-context';
import { Link, useRouter } from '@/i18n/navigation';
import {
  type DocumentKind,
  getPauschaleKey,
  type PauschalenType,
} from '../doc-type-header';
import { TemplateBuilderBlockEditor } from './builder-block-editor';
import {
  getContractDocument,
  getInvoiceDocument,
  getKnownOrgValues,
} from './builder-document-presets';
import {
  ALWAYS_AVAILABLE_SOURCES,
  countIncompleteManualFields,
  type DataSourceKey,
  PROFILE_REQUIRED_SOURCES,
  type TemplateDocument,
} from './builder-types';
import { GeneratedDocumentPreview } from './generated-document-preview';

// Mock: profile-required sources this org hasn't collected yet.
const MOCK_PROFILE_GAPS = new Set<DataSourceKey>(['volunteer_tax_id']);

const ALL_DATA_SOURCES: DataSourceKey[] = [
  ...ALWAYS_AVAILABLE_SOURCES,
  ...PROFILE_REQUIRED_SOURCES,
];

const PLACEHOLDER_TABLE_TOTAL_ROW = ['', '', 'Summe', '—', '—'];

// The Pauschale reimbursement itself isn't a VAT-liable supply, but the rate is always 0% —
// stated on every invoice regardless, never computed from the total.
const TABLE_VAT_ROW = ['', '', 'zzgl. 0 % USt.', '', '0,00 €'];

// Placeholder rows for the invoice's Stundennachweis table — no real timesheets exist at
// template-configuration time, only the column shape and the chosen first-column source (see
// getInvoiceDocument's table block). The first cell reflects that choice so toggling it in the
// editor visibly changes the preview, per the live-preview acceptance criterion.
function getPlaceholderTableRows(
  templateDoc: TemplateDocument,
  t: ReturnType<typeof useTranslations>,
): string[][] {
  const tableBlock = templateDoc.blocks.find((b) => b.kind === 'table');
  const firstColumnPlaceholder =
    tableBlock?.kind === 'table' && tableBlock.firstColumnSource === 'custom'
      ? tableBlock.firstColumnCustomLabel ||
        t('blockEditor.firstColumnPlaceholders.custom')
      : t('blockEditor.firstColumnPlaceholders.agreementTaskDescription');
  return [
    [firstColumnPlaceholder, '', '', '', ''],
    [firstColumnPlaceholder, '', '', '', ''],
    [firstColumnPlaceholder, '', '', '', ''],
  ];
}

interface TemplateBuilderProps {
  pauschale: PauschalenType;
  kind: DocumentKind;
  backHref?: string;
}

export function TemplateBuilder({
  pauschale,
  kind,
  backHref,
}: TemplateBuilderProps) {
  const t = useTranslations('Accounting.templates.builder');
  const tSections = useTranslations('Accounting.templates');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const [templateDoc, setTemplateDoc] = useState<TemplateDocument>(() =>
    kind === 'contract'
      ? getContractDocument(pauschale)
      : getInvoiceDocument(pauschale),
  );

  const incompleteCount = countIncompleteManualFields(templateDoc);
  const knownValues = getKnownOrgValues(pauschale);

  const kindLabel = tSections(
    `documentKind.${kind}` as Parameters<typeof tSections>[0],
  );
  const typeLabel = tSections(
    `sections.${getPauschaleKey(pauschale)}` as Parameters<typeof tSections>[0],
  );

  // Label for every bound source with no value yet at config time (no volunteer/period
  // exists) — GeneratedDocumentPreview only consults this for a source it can't resolve
  // from `values`, so it's safe to hand it the full source list unconditionally.
  const unresolvedLabels = Object.fromEntries(
    ALL_DATA_SOURCES.map((key) => [
      key,
      t(`dataSources.${key}` as Parameters<typeof t>[0]),
    ]),
  ) as Partial<Record<DataSourceKey, string>>;

  const documentTitle = t(
    (kind === 'contract'
      ? 'preview.documentTitle.contract'
      : 'preview.documentTitle.invoice') as Parameters<typeof t>[0],
  );
  const signerRightLabel = t(
    (kind === 'contract'
      ? 'preview.signatureCoordinator'
      : 'preview.signatureSupervisor') as Parameters<typeof t>[0],
  );

  function handleSave() {
    // No backend yet — stub success toast, same convention as the reimbursements board.
    toast.success(t('saveSuccessToast'));
    if (backHref) router.push(backHref);
  }

  const breadcrumb = useMemo(
    () => (
      <nav
        className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex"
        aria-label="Breadcrumb"
      >
        <span>{t('breadcrumb.accounting')}</span>
        <ChevronRightIcon size={14} aria-hidden="true" />
        {backHref ? (
          <Link
            href={backHref}
            className="hover:text-foreground transition-colors"
          >
            {t('breadcrumb.templates')}
          </Link>
        ) : (
          <span>{t('breadcrumb.templates')}</span>
        )}
        <ChevronRightIcon size={14} aria-hidden="true" />
        <span className="text-foreground font-medium">
          {typeLabel} · {kindLabel}
        </span>
      </nav>
    ),
    [backHref, typeLabel, kindLabel, t],
  );
  usePageBreadcrumb(breadcrumb);

  // Locks page scroll while mounted: the two preview/editor panes own their own scrolling,
  // but a wheel gesture over the non-scrollable footer row (Save button) would otherwise
  // bubble to the admin shell's `min-h-svh` wrapper, which can grow past the viewport on
  // <html> or <body> — both need locking, or that gesture scrolls the whole page behind
  // this fixed-height layout instead of doing nothing.
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div className="flex h-[calc(100svh-6rem-1px)] flex-col gap-6">
      <div className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-6">
        <section
          className="min-h-0 overflow-y-auto pb-12 [mask-image:linear-gradient(to_bottom,black_0,black_calc(100%-2rem),transparent_100%)]"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 requires this independently-scrollable region to be keyboard-reachable (axe "scrollable-region-focusable").
          tabIndex={0}
          aria-label={t('previewScrollRegionLabel')}
        >
          <GeneratedDocumentPreview
            document={templateDoc}
            kind={kind}
            pauschale={pauschale}
            pauschaleLabel={typeLabel}
            documentTitle={documentTitle}
            orgName={knownValues.org_name ?? ''}
            disclaimerLabel={t('preview.disclaimerBadge')}
            signerLeftLabel={t('preview.signatureVolunteer')}
            signerRightLabel={signerRightLabel}
            unsignedLabel={t('preview.unsigned')}
            values={knownValues}
            unresolvedLabels={unresolvedLabels}
            gapSources={MOCK_PROFILE_GAPS}
            tableRows={
              kind === 'invoice'
                ? getPlaceholderTableRows(templateDoc, t)
                : undefined
            }
            tableTotalRow={
              kind === 'invoice' ? PLACEHOLDER_TABLE_TOTAL_ROW : undefined
            }
            tableNoteRow={kind === 'invoice' ? TABLE_VAT_ROW : undefined}
          />
        </section>
        <section
          className="min-h-0 overflow-y-auto pb-12 [mask-image:linear-gradient(to_bottom,black_0,black_calc(100%-2rem),transparent_100%)]"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 requires this independently-scrollable region to be keyboard-reachable (axe "scrollable-region-focusable").
          tabIndex={0}
          aria-label={t('blockEditor.scrollRegionLabel')}
        >
          <TemplateBuilderBlockEditor
            document={templateDoc}
            kind={kind}
            profileGaps={MOCK_PROFILE_GAPS}
            knownValues={knownValues}
            typeLabel={typeLabel}
            onChange={setTemplateDoc}
          />
        </section>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        {incompleteCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {t('blockEditor.incompleteCount', {
              count: incompleteCount,
            } as Parameters<typeof t>[1])}
          </span>
        )}
        <div className="flex items-center gap-2">
          {backHref && (
            <Button type="button" variant="outline" asChild>
              <Link href={backHref}>{tCommon('cancel')}</Link>
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={incompleteCount > 0}
          >
            {t('saveButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
