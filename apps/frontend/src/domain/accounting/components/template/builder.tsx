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
import { TemplateBuilderPreview } from './builder-preview';
import {
  countIncompleteManualFields,
  type DataSourceKey,
  type TemplateDocument,
} from './builder-types';

// Mock: profile-required sources this org hasn't collected yet.
const MOCK_PROFILE_GAPS = new Set<DataSourceKey>(['volunteer_tax_id']);

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

  // Locks page scroll while mounted: the admin shell's `min-h-svh` wrapper can grow past
  // the viewport, so overflow can land on <html>, not just <body> — both need locking.
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
        <TemplateBuilderPreview
          document={templateDoc}
          profileGaps={MOCK_PROFILE_GAPS}
          knownValues={knownValues}
          kind={kind}
        />
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

      <div className="flex shrink-0 items-center justify-end gap-3">
        {incompleteCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {t('blockEditor.incompleteCount', {
              count: incompleteCount,
            } as Parameters<typeof t>[1])}
          </span>
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
  );
}
